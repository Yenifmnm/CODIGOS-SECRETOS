/**
 * Saca el color REAL con el que se está dibujando un texto, leyendo el bitmap.
 *
 *   npm run dev                          # o BASE=https://... para el publicado
 *   node scripts/medir-color.mjs
 *   node scripts/medir-color.mjs --caso inicio
 *
 * Por qué no alcanza con `figma:check`: el control de pintura compara el
 * `color` COMPUTADO contra el del nodo. Eso dice qué le pidió el CSS al
 * navegador, no qué terminó en la pantalla. Si otra capa cae encima —un
 * resplandor, un velo, una sombra— el computado sigue diciendo `#FCC102` y el
 * usuario ve `#D6C82F`. Pasó: los dos `drop-shadow(0 0 250px #09EAFF)` del logo
 * de `inicio` caían sobre el titular porque `filter` promueve al logo por
 * encima de un texto `position: static`, y el control daba todo en verde.
 *
 * Esto recorta la caja del texto, se queda con los píxeles del glifo —los que
 * están lejos del fondo— y devuelve la MODA: el color que más se repite. Con la
 * moda y no el promedio, que mezclaría el trazo blanco y el cielo con el
 * relleno y no daría ningún color real.
 */

import { chromium } from 'playwright';

const BASE = process.env.BASE ?? 'http://localhost:5180';

const args = process.argv.slice(2);
const bandera = (n) => {
  const i = args.indexOf(n);
  return i === -1 ? null : args[i + 1] ?? null;
};

/* Cada caso: qué pantalla, qué elemento y qué color declara el nodo. */
const CASOS = [
  {
    nombre: 'inicio · Ganá un viaje al Caribe',
    ruta: '#/',
    sel: '.home-m__title',
    nodo: '70:194',
    esperado: '#FCC102',
  },
  {
    nombre: 'participar · Pequeños piratas!',
    ruta: '#/participar',
    sel: '.welcome-m__title',
    nodo: '70:349',
    esperado: '#FCC102',
  },
];

const pedido = bandera('--caso');
const objetivo = pedido ? CASOS.filter((c) => c.nombre.startsWith(pedido)) : CASOS;

const navegador = await chromium.launch(
  process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {},
);

let fallas = 0;

for (const caso of objetivo) {
  const pagina = await navegador.newPage({
    viewport: { width: 402, height: 851 },
    deviceScaleFactor: 3,
    reducedMotion: 'reduce',
  });
  await pagina.goto(`${BASE}/${caso.ruta}`, { waitUntil: 'networkidle' });
  await pagina.addStyleTag({
    content: '*,*::before,*::after{animation:none!important;transition:none!important}',
  });
  await pagina.waitForTimeout(500);

  const caja = await pagina.evaluate(([sel]) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left, y: r.top, width: r.width, height: r.height };
  }, [caso.sel]);

  if (!caja) {
    console.log(`  ? ${caso.nombre}: no existe ${caso.sel}`);
    await pagina.close();
    continue;
  }

  const captura = (await pagina.screenshot({ clip: caja })).toString('base64');
  await pagina.close();

  // El análisis va en una página en blanco: pasarle el PNG a la página con la
  // app cargada la ahoga. Mismo motivo que en `medir-costuras.mjs`.
  const lupa = await navegador.newPage();
  await lupa.setContent('<!doctype html><title>lupa</title>');
  const moda = await lupa.evaluate(async ([b64, hexEsperado]) => {
    const bin = atob(b64);
    const u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    const img = await createImageBitmap(new Blob([u8], { type: 'image/png' }));
    const c = document.createElement('canvas');
    c.width = img.width;
    c.height = img.height;
    const x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(img, 0, 0);
    const d = x.getImageData(0, 0, img.width, img.height).data;

    const hex = (r, g, b) =>
      '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();

    // Sólo los píxeles "cálidos": el relleno del glifo. Se descartan el cielo
    // (azul) y el trazo blanco, que si no ganarían la moda por volumen.
    const cuenta = new Map();
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i + 1], b = d[i + 2];
      if (r < 150 || b > r - 60 || g > r) continue;
      const k = hex(r, g, b);
      cuenta.set(k, (cuenta.get(k) ?? 0) + 1);
    }
    if (!cuenta.size) return null;
    const orden = [...cuenta].sort((a, b) => b[1] - a[1]);
    const total = orden.reduce((a, [, n]) => a + n, 0);
    const esperados = cuenta.get(hexEsperado) ?? 0;
    return {
      moda: orden[0][0],
      pct: +((100 * orden[0][1]) / total).toFixed(1),
      exactos: esperados,
      top: orden.slice(0, 3).map(([k, n]) => `${k} ${((100 * n) / total).toFixed(0)}%`),
    };
  }, [captura, caso.esperado]);
  await lupa.close();

  const ok = moda && moda.moda === caso.esperado;
  if (!ok) fallas++;
  console.log(
    `  ${ok ? '✓' : '✗'} ${caso.nombre.padEnd(34)} nodo ${caso.nodo}  ` +
      `esperado ${caso.esperado}  ·  moda ${moda ? moda.moda : '—'}` +
      (moda ? `  (${moda.pct}% de los píxeles del relleno)` : ''),
  );
  if (moda && !ok) console.log(`      los tres más frecuentes: ${moda.top.join('  ')}`);
}

await navegador.close();
console.log(
  fallas
    ? `\n  ${fallas} titular(es) con el color equivocado en pantalla.`
    : '\n  El color en pantalla coincide con el del nodo en todos.',
);
process.exit(0);

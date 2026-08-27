/**
 * Mide la CALIDEZ (R − B) por bandas horizontales, en los márgenes laterales,
 * y la compara contra el PNG del diseñador.
 *
 *   npm run dev                       # o BASE=https://... para el publicado
 *   node scripts/medir-calidez.mjs
 *   node scripts/medir-calidez.mjs --pantalla ganaste
 *
 * R − B es la medida útil para un derrame cálido sobre un cielo azul: el azul
 * del fondo da un número muy negativo, y cada punto que el resplandor dorado
 * suma lo acerca a cero. A diferencia del brillo absoluto, no se confunde con
 * que el export del diseñador esté más o menos expuesto: mide el TINTE, no la
 * luz.
 *
 * Se leen sólo los márgenes —lo que queda a los costados de la composición— por
 * la misma razón por la que `medir-costuras.mjs` mira ahí: en el medio hay
 * cofre, premio y textos, que taparían el fondo y meterían su propio color.
 */

import { chromium } from 'playwright';

const BASE = process.env.BASE ?? 'http://localhost:5180';

const args = process.argv.slice(2);
const bandera = (n) => {
  const i = args.indexOf(n);
  return i === -1 ? null : args[i + 1] ?? null;
};

const CASOS = [
  {
    nombre: 'ganaste',
    ruta: '?scenario=WIN#/ganaste',
    referencia: 'recursos/mobile/pantallas/ganaste.png',
    frameH: 969,
  },
];

const pedido = bandera('--pantalla');
const objetivo = pedido ? CASOS.filter((c) => c.nombre === pedido) : CASOS;

/* Márgenes: los 46 px de cada costado, donde sólo hay cielo, planeta y derrame. */
const MARGENES = [[0, 46], [356, 402]];
const BANDAS = [[600, 650], [650, 700], [700, 750], [750, 800], [800, 850], [850, 900], [900, 969]];

const navegador = await chromium.launch(
  process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {},
);

/** Devuelve la calidez media por banda, en coordenadas de DISEÑO. */
async function calidez(lupa, b64, offY) {
  return lupa.evaluate(
    async ([s, oy, margenes, bandas]) => {
      const bin = atob(s);
      const u8 = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      const img = await createImageBitmap(new Blob([u8], { type: 'image/png' }));
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      const x = c.getContext('2d', { willReadFrequently: true });
      x.drawImage(img, 0, 0);
      const d = x.getImageData(0, 0, img.width, img.height).data;
      const W = img.width;
      const k = W / 402;
      return bandas.map(([y0, y1]) => {
        let suma = 0;
        let n = 0;
        for (let y = Math.round((y0 + oy) * k); y < Math.round((y1 + oy) * k); y++) {
          if (y < 0 || y >= img.height) continue;
          for (const [x0, x1] of margenes)
            for (let xx = Math.round(x0 * k); xx < Math.round(x1 * k); xx++) {
              const i = (y * W + xx) * 4;
              suma += d[i] - d[i + 2];
              n++;
            }
        }
        return n ? Math.round(suma / n) : null;
      });
    },
    [b64, offY, MARGENES, BANDAS],
  );
}

const fs = await import('node:fs');

for (const caso of objetivo) {
  const lupa = await navegador.newPage();
  await lupa.setContent('<!doctype html><title>lupa</title>');

  // El PNG del diseñador ES el frame entero, barra de estado incluida: el
  // frame mide 969 CON la barra, así que la `y` de diseño mapea 1:1 al PNG y
  // el desplazamiento es CERO. (Ojo: no es lo mismo que en los frames de 913,
  // donde el área útil es 851 y hay que descontar. Acá el 969 ya la contiene.)
  const ref = await calidez(lupa, fs.readFileSync(caso.referencia).toString('base64'), 0);

  const pagina = await navegador.newPage({
    viewport: { width: 402, height: caso.frameH - 62 },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  });
  await pagina.goto(`${BASE}/${caso.ruta}`, { waitUntil: 'networkidle' });
  await pagina.addStyleTag({
    content: '*,*::before,*::after{animation:none!important;transition:none!important}',
  });
  await pagina.waitForTimeout(500);
  const shot = (await pagina.screenshot()).toString('base64');
  await pagina.close();

  // El sitio ya tiene el origen corrido: la barra no se dibuja.
  const sitio = await calidez(lupa, shot, -62);
  await lupa.close();

  console.log(`\n=== ${caso.nombre} · calidez (R − B) en los márgenes ===`);
  console.log('  banda y      FIGMA    SITIO    dif');
  let peor = 0;
  BANDAS.forEach(([y0, y1], i) => {
    const f = ref[i];
    const s = sitio[i];
    if (f == null || s == null) return;
    const dif = s - f;
    if (Math.abs(dif) > Math.abs(peor)) peor = dif;
    const marca = Math.abs(dif) <= 15 ? ' ' : Math.abs(dif) <= 40 ? '·' : '✗';
    console.log(
      `  ${`${y0}-${y1}`.padEnd(11)}${String(f).padStart(6)}${String(s).padStart(9)}` +
        `${(dif > 0 ? '+' : '') + dif}`.padStart(8) + `  ${marca}`,
    );
  });
  console.log(`\n  Peor diferencia: ${peor > 0 ? '+' : ''}${peor}  (negativo = el sitio está más frío)`);
}

await navegador.close();
process.exit(0);

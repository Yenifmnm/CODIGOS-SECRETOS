/**
 * Cuenta los píxeles de RELLENO y de CONTORNO de cada texto con trazo, en el
 * render y en el export de Figma, y los compara.
 *
 *   npm run dev                    # o BASE=https://... para el publicado
 *   node scripts/medir-trazo.mjs   # `npm run audit:trazo`
 *
 * Para qué: `figma:check` compara la CAJA de un texto y su color declarado. Dos
 * letras del mismo cuerpo, en la misma caja y del mismo color pueden tener el
 * doble de tinta una que la otra, y el control da ✓. Fue el caso de
 * `paint-order: stroke fill` — una propiedad que Figma no tiene y que el código
 * había agregado: el relleno se pintaba ENCIMA del trazo, así que la letra de
 * color no adelgazaba y del contorno sólo se veía la mitad de afuera.
 *
 * CÓMO DETECTA. No hay un detector de blanco: los colores salen del NODO. Cada
 * píxel se compara contra el relleno y contra el trazo del spec, y cuenta para
 * el que tenga más cerca, si está a menos de TOLERANCIA. Así
 * `74:1107` «Estuviste cerca» —relleno #E63303, trazo #FCC102— se mide con su
 * propia pareja de colores y no con la de las demás, sin ningún caso especial.
 *
 * TRES COSAS QUE ARRUINAN LA MEDICIÓN SI SE HACEN MAL:
 *
 * 1. **Los dos lados a 1×.** Los export de `recursos/mobile/pantallas/` están a
 *    1:1. Medir el sitio a `deviceScaleFactor: 3` y compararlo contra un PNG de
 *    1× da una diferencia de tinta que es sólo el antialiasing de otra escala.
 * 2. **La barra de estado NO se suma al export.** Los PNG ya la traen dibujada,
 *    así que la `y` del diseño mapea 1:1 sobre el export; en el render, en
 *    cambio, hay que restarle los 62 px, porque el cero de la página es el
 *    borde de abajo de la barra.
 * 3. **El mismo recorte para los dos.** El recorte sale de la caja del NODO, no
 *    del DOM: si sale de `getBoundingClientRect()` los dos lados miden cajas
 *    distintas y la cuenta no compara nada.
 *
 * La columna `antes` vuelve a poner `paint-order: stroke fill` por CSS inyectado
 * sobre la misma página, para tener el defecto y el arreglo medidos con la misma
 * regla y en la misma corrida.
 */

import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const BASE = process.env.BASE ?? 'http://localhost:5180';
const TOLERANCIA = 60;  // distancia RGB. #E63303 y #FCC102 estan a 144: no se pisan.
const MARGEN = 14;      // px alrededor de la caja del nodo, iguales en los dos lados.
const BARRA = 62;       // la barra de estado, que el export trae y la pagina no.

const PANTALLAS = JSON.parse(readFileSync('figma/nodes.json', 'utf8')).pantallas;

/** Los TEXT con trazo del spec, que son los que hay que comparar. */
function textosConTrazo(slug) {
  let spec;
  try {
    spec = JSON.parse(readFileSync(`figma/spec/${slug}.json`, 'utf8'));
  } catch {
    return { frame: null, nodos: [] };
  }
  const nodos = [];
  const walk = (n) => {
    if (n.tipo === 'TEXT' && n.trazo?.length && n.relleno?.length) {
      nodos.push({
        id: n.id,
        texto: (n.texto ?? '').replace(/\s+/g, ' ').trim(),
        rect: n.rect,
        relleno: n.relleno[0].color,
        trazo: n.trazo[0].color,
        ancho: n.trazoAncho,
        alineacion: n.trazoAlineacion,
        fs: n.tipografia?.tamano,
      });
    }
    for (const h of n.hijos ?? []) walk(h);
  };
  walk(spec.arbol);
  return { frame: spec.frame, nodos };
}

/* Se cuenta dentro del navegador: es el único que sabe decodificar un PNG sin
   agregar dependencias. La misma función para el render y para el export. */
const CONTAR = async ({ b64, caja, relleno, trazo, tol }) => {
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [fr, fg, fb] = hex(relleno);
  const [sr, sg, sb] = hex(trazo);
  const img = await createImageBitmap(
    await (await fetch(`data:image/png;base64,${b64}`)).blob(),
  );
  const x = Math.max(0, Math.round(caja.x));
  const y = Math.max(0, Math.round(caja.y));
  const w = Math.min(Math.round(caja.w), img.width - x);
  const h = Math.min(Math.round(caja.h), img.height - y);
  if (w <= 0 || h <= 0) return { relleno: 0, trazo: 0, fuera: true };
  const c = new OffscreenCanvas(w, h);
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(img, x, y, w, h, 0, 0, w, h);
  const d = g.getImageData(0, 0, w, h).data;
  let nf = 0;
  let ns = 0;
  const t2 = tol * tol;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 128) continue;
    const df = (d[i] - fr) ** 2 + (d[i + 1] - fg) ** 2 + (d[i + 2] - fb) ** 2;
    const ds = (d[i] - sr) ** 2 + (d[i + 1] - sg) ** 2 + (d[i + 2] - sb) ** 2;
    if (df <= t2 && df < ds) nf++;
    else if (ds <= t2 && ds < df) ns++;
  }

  /* REPARTO, sin umbral y sin escala: qué proporción de la tinta es relleno.
     Cada píxel se proyecta sobre el eje que va del color de relleno al del
     trazo y se promedia. Es la columna que hay que mirar: al ser un COCIENTE no
     depende de la tolerancia ni del `deviceScaleFactor`, así que el render a 3×
     se puede comparar contra un export de 1×, cosa que los conteos absolutos NO
     permiten. Verificado: el mismo orden a tol 40/60/80/100 y a 1×, 2× y 3×. */
  const vx = sr - fr;
  const vy = sg - fg;
  const vz = sb - fb;
  const L2 = vx * vx + vy * vy + vz * vz;
  let acc = 0;
  let n = 0;
  for (let i = 0; i < d.length; i += 4) {
    const t = ((d[i] - fr) * vx + (d[i + 1] - fg) * vy + (d[i + 2] - fb) * vz) / L2;
    if (t < -0.1 || t > 1.1) continue;
    const e =
      (d[i] - (fr + t * vx)) ** 2 +
      (d[i + 1] - (fg + t * vy)) ** 2 +
      (d[i + 2] - (fb + t * vz)) ** 2;
    if (e > 45 * 45) continue;   // lejos del eje: es fondo o glow, no es tinta
    acc += Math.min(1, Math.max(0, t));
    n++;
  }

  return { relleno: nf, trazo: ns, reparto: n ? Math.round(100 * (1 - acc / n)) : 0 };
};

const navegador = await chromium.launch(
  process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {},
);
const lupa = await navegador.newPage();   // pagina en blanco, solo para contar
await lupa.goto('about:blank');

const pct = (a, b) => (b === 0 ? (a === 0 ? '0%' : '∞') : `${a > b ? '+' : ''}${Math.round((100 * (a - b)) / b)}%`);
const filas = [];

for (const [slug, cfg] of Object.entries(PANTALLAS)) {
  const { frame, nodos } = textosConTrazo(slug);
  if (!nodos.length) continue;

  /* La rama mobile tiene export de referencia y barra de estado; la de
     escritorio no tiene ninguno de los dos. Sin export no hay contra qué
     comparar, pero el antes/después del render se mide igual. */
  const esMobile = slug.endsWith('-mobile');
  const barra = esMobile ? BARRA : 0;
  const refB64 = cfg.referencia ? readFileSync(cfg.referencia).toString('base64') : null;

  const pagina = await navegador.newPage({
    viewport: { width: frame?.w ?? 402, height: (frame?.h ?? 913) - barra },
    deviceScaleFactor: 1,      // 1x los dos lados, si no se mide el antialiasing
    reducedMotion: 'reduce',
  });
  const ruta = cfg.ruta ?? '#/';
  await pagina.goto(`${BASE}/${ruta}`, { waitUntil: 'networkidle' });
  await pagina.addStyleTag({
    content: '*,*::before,*::after{animation:none!important;transition:none!important}',
  });
  // `menu-mobile` es un ESTADO, no una ruta: hay que abrirlo para poder medirlo.
  if (slug === 'menu-mobile') {
    await pagina.getByRole('button', { name: /Abrir menú/i }).click();
    await pagina.waitForTimeout(400);
  }
  await pagina.evaluate(() => document.fonts.ready);
  await pagina.waitForTimeout(600);

  const disparo = async () => (await pagina.screenshot()).toString('base64');
  const ahoraB64 = await disparo();

  // El defecto, vuelto a poner por CSS, para medirlo con la misma regla.
  const parche = await pagina.addStyleTag({
    content: '*{paint-order:stroke fill!important}',
  });
  await pagina.waitForTimeout(250);
  const antesB64 = await disparo();
  await parche.evaluate((el) => el.remove());

  for (const n of nodos) {
    const cajaRender = {
      x: n.rect.x - MARGEN,
      y: n.rect.y - barra - MARGEN,
      w: n.rect.w + 2 * MARGEN,
      h: n.rect.h + 2 * MARGEN,
    };
    // El export ya trae la barra dibujada: la y del diseño va 1:1.
    const cajaRef = { ...cajaRender, y: n.rect.y - MARGEN };
    const arg = { relleno: n.relleno, trazo: n.trazo, tol: TOLERANCIA };
    const figma = refB64
      ? await lupa.evaluate(CONTAR, { b64: refB64, caja: cajaRef, ...arg })
      : null;
    const ahora = await lupa.evaluate(CONTAR, { b64: ahoraB64, caja: cajaRender, ...arg });
    const antes = await lupa.evaluate(CONTAR, { b64: antesB64, caja: cajaRender, ...arg });
    const marcado = await pagina
      .locator(`[data-figma~="${n.id}"]`)
      .count()
      .catch(() => 0);
    filas.push({ slug, ...n, figma, ahora, antes, marcado: marcado > 0 });
  }

  await pagina.close();
}

await navegador.close();

// ------------------------------------------------------------------ la tabla
console.log(
  '\n  REPARTO DE TINTA — qué % de la tinta del texto es RELLENO (el resto, contorno).\n' +
    '  `antes` = con paint-order: stroke fill. Es un cociente: no depende de la escala.\n',
);
console.log(
  '  pantalla                   nodo      texto                  antes  →  ahora    FIGMA   dist.antes  dist.ahora',
);
console.log(
  '  -------------------------  --------  ---------------------  --------------   ------   ----------  ----------',
);
let malos = 0;
let peor = 0;
for (const f of filas) {
  const F = f.figma ? f.figma.reparto : null;
  const dA = F === null ? null : f.antes.reparto - F;
  const dB = F === null ? null : f.ahora.reparto - F;
  if (F !== null && Math.abs(dB) > 10) malos++;
  if (F !== null && Math.abs(dB) > Math.abs(dA)) peor++;
  const sig = (d) => (d === null ? 'sin ref' : `${d > 0 ? '+' : ''}${d}`).padStart(9);
  console.log(
    `  ${f.slug.padEnd(25)}  ${f.id.padEnd(8)}  ${f.texto.slice(0, 21).padEnd(21)}  ` +
      `${String(f.antes.reparto + '%').padStart(5)} → ${String(f.ahora.reparto + '%').padStart(5)}   ` +
      `${(F === null ? '—' : F + '%').padStart(6)}   ${sig(dA)}   ${sig(dB)}` +
      `${F !== null && Math.abs(dB) > Math.abs(dA) ? '   ← se alejó' : ''}`,
  );
}
console.log('\n  Conteos absolutos, los dos lados a 1× y con el mismo recorte:');
console.log(
  '  pantalla                   nodo      relleno: antes → ahora   Figma    contorno: antes → ahora   Figma   trazo del nodo',
);
for (const f of filas) {
  console.log(
    `  ${f.slug.padEnd(25)}  ${f.id.padEnd(8)}  ` +
      `${String(f.antes.relleno).padStart(8)} → ${String(f.ahora.relleno).padStart(7)}  ${String(f.figma?.relleno ?? '—').padStart(6)}   ` +
      `${String(f.antes.trazo).padStart(9)} → ${String(f.ahora.trazo).padStart(7)}  ${String(f.figma?.trazo ?? '—').padStart(6)}   ` +
      `${f.relleno}/${f.trazo} ${f.ancho}px ${f.alineacion}${f.marcado ? '' : '  (sin data-figma)'}`,
  );
}
console.log(
  `\n  ${filas.length} textos con trazo en ${new Set(filas.map((f) => f.slug)).size} pantallas, ` +
    `${new Set(filas.filter((f) => f.figma).map((f) => f.slug)).size} de ellas con export contra el que comparar.\n` +
    `  ${malos} con el reparto a más de 10 puntos del Figma; ${peor} MÁS LEJOS que antes del cambio.`,
);
process.exit(0);

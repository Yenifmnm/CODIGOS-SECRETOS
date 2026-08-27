/**
 * El mismo diff de píxeles contra el export, pero en DOS motores.
 *
 *   npm run dev                      # o BASE=https://... para el publicado
 *   node scripts/medir-webkit.mjs    # `npm run audit:webkit`
 *
 * Por qué existe: en iPhone TODOS los navegadores son WebKit, así que probar en
 * otro navegador del mismo teléfono no prueba nada. Y todo lo que mide este
 * repo —`figma:check`, `audit:responsive`, `audit:trazo`, `audit:efectos`—
 * corre en Chromium. Una diferencia de rasterizado de WebKit pasa las diez
 * pantallas en ✓ y aun así se ve mal en la mitad de los teléfonos.
 *
 * La clienta lo reportó así: en Android el diseño se ve bien y en iPhone «el
 * resplandor de los textos se ve mucho más fuerte, como una banda blanca».
 *
 * QUÉ MIDE. Por pantalla, el porcentaje de píxeles que difieren del export de
 * `recursos/mobile/pantallas/`, en Chromium y en WebKit, con el mismo recorte y
 * la misma tolerancia.
 *
 * CÓMO SE LEE, Y ESTO IMPORTA. El criterio es que LOS DOS MOTORES SE ACERQUEN
 * AL EXPORT. La brecha entre ellos baja como consecuencia; no es el objetivo.
 *
 * Ponerse como meta «que la brecha entre motores sea menor a 2» premia la
 * convergencia por degradación, y no es teórico: barriendo el trazo del titular
 * del landing, la variante `sin blanco` daba una brecha de 2,42 contra los 5,76
 * de la versión buena, y lo lograba empeorando WebKit de 14,06% a 18,43%. Los
 * dos motores más lejos del diseño, y el número de la brecha mejor. Por eso la
 * tabla ordena por distancia al export y la brecha va al final, como derivada.
 *
 * El valor absoluto tampoco se lee solo: el export trae la barra de estado y
 * capas que el sitio no dibuja, así que lo que compara es una pantalla contra
 * sí misma entre motores y entre versiones.
 *
 * LÍMITE QUE HAY QUE TENER PRESENTE: el WebKit de Playwright NO es Safari de
 * iOS. Comparte el motor de rasterizado, que es lo que acá se está buscando,
 * pero no es la misma compilación ni corre sobre el mismo sistema gráfico. Sirve
 * para localizar la propiedad culpable; no sirve para dar por cerrado el caso
 * sin que alguien lo mire en un iPhone.
 */

import { chromium, webkit } from 'playwright';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const BASE = process.env.BASE ?? 'http://localhost:5180';
const BARRA = 62;
const PANTALLAS = Object.entries(
  JSON.parse(readFileSync('figma/nodes.json', 'utf8')).pantallas,
).filter(([slug, cfg]) => slug.endsWith('-mobile') && cfg.ruta && cfg.referencia);

/* El diff se cuenta dentro del navegador, que es el único que decodifica un PNG
   sin dependencias. Se descuenta la banda de la barra de estado, que el export
   trae dibujada y la página no puede dibujar. */
const DIFF = async ({ sitio, ref, barra }) => {
  const carga = async (b64) => {
    const img = await createImageBitmap(
      await (await fetch(`data:image/png;base64,${b64}`)).blob(),
    );
    const c = new OffscreenCanvas(img.width, img.height);
    const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(img, 0, 0);
    return { d: g.getImageData(0, 0, img.width, img.height).data, w: img.width, h: img.height };
  };
  const A = await carga(sitio);
  const B = await carga(ref);
  const w = Math.min(A.w, B.w);
  const h = Math.min(A.h, B.h - barra);
  let dist = 0;
  let masClaro = 0;
  let total = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ia = 4 * (y * A.w + x);
      const ib = 4 * ((y + barra) * B.w + x);
      total++;
      const d =
        Math.abs(A.d[ia] - B.d[ib]) +
        Math.abs(A.d[ia + 1] - B.d[ib + 1]) +
        Math.abs(A.d[ia + 2] - B.d[ib + 2]);
      if (d <= 36) continue;
      dist++;
      const lA = (A.d[ia] + A.d[ia + 1] + A.d[ia + 2]) / 3;
      const lB = (B.d[ib] + B.d[ib + 1] + B.d[ib + 2]) / 3;
      if (lA > lB) masClaro++;
    }
  }
  return {
    pct: +((100 * dist) / total).toFixed(2),
    claro: +((100 * masClaro) / Math.max(1, dist)).toFixed(0),
  };
};

/* La lupa que cuenta los píxeles es SIEMPRE de Chromium, mida quien mida: es
   un solo instrumento para los dos motores, y además el WebKit de Playwright no
   trae `OffscreenCanvas` en la página. */
const medidor = await chromium.launch();
const lupa = await medidor.newPage();
await lupa.goto('about:blank');

async function medir(tipo, nombre) {
  const nav = await tipo.launch();
  const out = new Map();
  for (const [slug, cfg] of PANTALLAS) {
    const frame = JSON.parse(readFileSync(`figma/spec/${slug}.json`, 'utf8')).frame;
    const p = await nav.newPage({
      viewport: { width: frame.w, height: frame.h - BARRA },
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
    });
    await p.goto(`${BASE}/${cfg.ruta}`, { waitUntil: 'networkidle' });
    await p.addStyleTag({
      content: '*,*::before,*::after{animation:none!important;transition:none!important}',
    });
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(700);
    const sitio = (await p.screenshot()).toString('base64');
    await p.close();
    out.set(
      slug,
      await lupa.evaluate(DIFF, {
        sitio,
        ref: readFileSync(cfg.referencia).toString('base64'),
        barra: BARRA,
      }),
    );
  }
  await nav.close();
  console.error(`  (${nombre} medido)`);
  return out;
}

/* CSS QUE SÓLO SE APLICA EN UN MOTOR. Si alguna hoja trae un
   `@supports (-webkit-touch-callout: none)` —el truco habitual para apuntarle a
   iOS— o cualquier otra condición que un motor cumpla y el otro no, entonces
   este control ya no compara el MISMO diseño en los dos lados: compara dos
   diseños y, si los dos aciertan, informa que coinciden. Eso es peor que no
   medir, porque se lee como confirmación.

   No se prohíbe la técnica: es válida y a veces es la única salida. Lo que no
   puede pasar es que esté y que este script no lo sepa. */
function cssPorMotor(dir, out = []) {
  for (const nombre of readdirSync(dir)) {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) {
      cssPorMotor(ruta, out);
      continue;
    }
    if (!nombre.endsWith('.css')) continue;
    const texto = readFileSync(ruta, 'utf8');
    const lineas = texto.split(/\r?\n/);
    lineas.forEach((linea, i) => {
      if (!/@supports/.test(linea)) return;
      // Condiciones que separan motores: propiedades con prefijo de proveedor.
      const m = linea.match(/@supports[^{]*(-webkit-|-moz-|-ms-)[^{]*/);
      if (m) out.push({ ruta, linea: i + 1, texto: linea.trim() });
    });
  }
  return out;
}

const gateadas = cssPorMotor('src');
if (gateadas.length) {
  console.log('\n  ⚠ HAY CSS QUE SÓLO SE APLICA EN UN MOTOR. Las columnas de abajo NO comparan');
  console.log('    el mismo diseño: si las dos aciertan, es contra reglas distintas.\n');
  for (const g of gateadas) {
    console.log(`      ${g.ruta}:${g.linea}  ${g.texto.slice(0, 92)}`);
  }
  console.log(
    '\n    Al leer la tabla, tener presente qué reglas caen dentro de esos bloques.',
  );
}

const ch = await medir(chromium, 'chromium');
const wk = await medir(webkit, 'webkit');
await medidor.close();

console.log('\n  Diff de píxeles contra el export, por motor.');
console.log('  «más claro» = qué % de los píxeles distintos son MÁS CLAROS que el diseño;');
console.log('  una banda blanca de más se ve como ese número cerca de 100.\n');
console.log('  ORDENADO POR DISTANCIA AL EXPORT. La brecha entre motores es la última');
console.log('  columna a propósito: es una consecuencia, no la meta.\n');
console.log('  pantalla                     chromium   webkit    el peor de los dos   brecha   más claro ch → wk');
console.log('  ---------------------------  --------   -------   ------------------   ------   -----------------');
const filas = PANTALLAS.map(([slug]) => {
  const a = ch.get(slug);
  const b = wk.get(slug);
  return { slug, a, b, peor: Math.max(a.pct, b.pct), brecha: +Math.abs(b.pct - a.pct).toFixed(2) };
}).sort((x, y) => y.peor - x.peor);
for (const f of filas) {
  console.log(
    `  ${f.slug.padEnd(27)}  ${String(f.a.pct + '%').padStart(7)}   ${String(f.b.pct + '%').padStart(7)}   ` +
      `${String(f.peor.toFixed(2) + '%').padStart(18)}   ${String(f.brecha).padStart(6)}   ` +
      `${String(f.a.claro + '%').padStart(7)} → ${String(f.b.claro + '%').padStart(4)}`,
  );
}
const lejos = filas[0];
const brecha = filas.reduce((m, f) => (f.brecha > m.brecha ? f : m));
console.log(
  `\n  La más lejos del export: ${lejos.slug} (${lejos.peor.toFixed(2)}% en el peor motor).\n` +
    `  La de mayor brecha entre motores: ${brecha.slug} (${brecha.brecha}).\n` +
    `  Una brecha chica con las dos columnas altas NO es un logro: son los dos lejos del diseño.`,
);
process.exit(0);

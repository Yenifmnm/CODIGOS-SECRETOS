/**
 * Comprueba que ninguna cinta SVG esté tapada por un fondo plano.
 *
 *   npm run dev                    # o BASE=https://... para el publicado
 *   node scripts/medir-cintas.mjs
 *
 * Las doce cintas ocres del diseño mobile se dibujan con el SVG de su nodo
 * (`components/promo/RibbonSvg.tsx`). Si el contenedor de una de ellas pinta un
 * `background`, ese color plano queda ENCIMA del SVG y la silueta desaparece:
 * se ve un rectángulo. Pasó en los tres botones —el `background` de la clase de
 * tono le ganaba por orden de cascada al intento de apagarlo—, y desde el DOM
 * no se nota, porque el `<img>` está ahí y con la caja correcta.
 *
 * Por eso este control no mira el CSS: recorre el DOM buscando cada
 * `.ribbon-svg` y le pregunta al contenedor si pinta algo. Es el mismo criterio
 * que `medir-costuras.mjs` y `medir-color.mjs`: preguntar por lo dibujado y no
 * por lo declarado.
 */

import { chromium } from 'playwright';

const BASE = process.env.BASE ?? 'http://localhost:5180';

const RUTAS = [
  ['inicio', '#/'],
  ['participar', '#/participar'],
  ['registro', '#/registro'],
  ['premios', '#/premios'],
  ['codigo', '#/donde-esta-el-codigo'],
  ['bases', '#/bases'],
  ['ganaste', '?scenario=WIN#/ganaste'],
  ['perdiste', '?scenario=LOSE#/perdiste'],
  ['utilizado', '?scenario=CODE_ALREADY_USED#/codigo-utilizado'],
  ['inexistente', '?scenario=CODE_NOT_FOUND#/codigo-inexistente'],
];

const navegador = await chromium.launch(
  process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {},
);

let tapadas = 0;
let total = 0;

console.log('  nodo      contenedor                       fondo                         ');
console.log('  --------  -------------------------------  ------------------------------');

for (const [nombre, ruta] of RUTAS) {
  const pagina = await navegador.newPage({
    viewport: { width: 402, height: 851 },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  });
  await pagina.goto(`${BASE}/${ruta}`, { waitUntil: 'networkidle' });
  await pagina.addStyleTag({
    content: '*,*::before,*::after{animation:none!important;transition:none!important}',
  });
  await pagina.waitForTimeout(400);

  const filas = await pagina.evaluate(() => {
    const pinta = (v) => v && v !== 'none' && v !== 'rgba(0, 0, 0, 0)' && v !== 'transparent';
    return [...document.querySelectorAll('.ribbon-svg')].map((el) => {
      const cont = el.parentElement;
      const cs = getComputedStyle(cont);
      const malo = pinta(cs.backgroundColor) || pinta(cs.backgroundImage);
      return {
        nodo: el.getAttribute('data-figma') ?? '—',
        cont: cont.tagName.toLowerCase() + '.' + String(cont.className).split(' ').slice(0, 2).join('.'),
        color: pinta(cs.backgroundColor) ? cs.backgroundColor : null,
        img: pinta(cs.backgroundImage) ? cs.backgroundImage.slice(0, 34) : null,
        malo,
      };
    });
  });
  await pagina.close();

  if (!filas.length) continue;
  console.log(`  · ${nombre}`);
  for (const f of filas) {
    total++;
    if (f.malo) tapadas++;
    const fondo = f.malo ? [f.color, f.img].filter(Boolean).join(' + ') : 'sin fondo';
    console.log(
      `  ${f.nodo.padEnd(9)} ${f.cont.slice(0, 31).padEnd(32)} ${fondo.padEnd(30)} ${f.malo ? 'TAPADA' : 'ok'}`,
    );
  }
}

await navegador.close();
console.log(
  `\n  ${total} cinta(s) en el DOM, ${tapadas} tapada(s) por el fondo de su contenedor.`,
);
process.exit(0);

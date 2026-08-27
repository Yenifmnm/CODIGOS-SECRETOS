/**
 * Mide las diez pantallas mobile en varios anchos y saca los dos números que
 * deciden si la composición "llena" el teléfono:
 *
 *   npm run dev                 # en otra terminal
 *   node scripts/medir-anchos.mjs
 *   node scripts/medir-anchos.mjs --anchos 320,402 --json
 *
 * 1. LA FRANJA LATERAL. Cuánto queda sin cubrir a cada lado. No se mide contra
 *    el lienzo —que a propósito puede ser más angosto que la pantalla— sino
 *    contra el VIEWPORT: la pregunta es qué ve el usuario en el borde, no qué
 *    ancho declaró un div. Se toma la capa que llega más a la izquierda y la
 *    que llega más a la derecha entre las que tienen que sangrar.
 *
 * 2. EL TEXTO MÁS CHICO que hay que leer. Recorre el DOM, descarta lo
 *    decorativo (`aria-hidden`, `.sr-only`, el panel de desarrollo) y devuelve
 *    el cuerpo en px REALES del texto legible más chico, con su contenido.
 *    En px reales y no de diseño: 12 px de diseño a escala 0,667 son 8, y
 *    ocho no se leen aunque el spec diga doce.
 *
 * Existe porque `figma:check` mide contra el frame de 402 y no puede ver nada
 * de esto: a 402 la escala es 1, no hay franja y el texto está en su tamaño de
 * diseño. Los dos problemas aparecen sólo cuando la pantalla NO mide 402.
 */

import { chromium } from 'playwright';

const BASE = process.env.BASE ?? 'http://localhost:5180';

const args = process.argv.slice(2);
const bandera = (n) => {
  const i = args.indexOf(n);
  return i === -1 ? null : args[i + 1] ?? null;
};
const json = args.includes('--json');
const ANCHOS = (bandera('--anchos') ?? '320,360,375,390,402,430').split(',').map(Number);

/* Alto de cada ancho: el del teléfono real más común con ese ancho. No se usa
   un alto fijo porque la escala mobile mira los dos ejes, y medir 320x913
   inventaría un teléfono que no existe. */
const ALTO = { 320: 568, 360: 640, 375: 667, 390: 844, 402: 874, 412: 915, 430: 932 };

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

const filas = [];

for (const ancho of ANCHOS) {
  const alto = ALTO[ancho] ?? 851;
  for (const [nombre, ruta] of RUTAS) {
    const pagina = await navegador.newPage({
      viewport: { width: ancho, height: alto },
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
    });
    await pagina.goto(`${BASE}/${ruta}`, { waitUntil: 'networkidle' });
    await pagina.addStyleTag({
      content: '*,*::before,*::after{animation:none!important;transition:none!important}',
    });
    await pagina.waitForTimeout(350);

    const m = await pagina.evaluate(() => {
      const W = document.documentElement.clientWidth;

      // --------------------------------------------------- 1. franja lateral
      // Las capas que TIENEN que llegar al borde. Si una de éstas no llega, se
      // ve fondo muerto; el resto de la composición puede quedar centrada.
      const QUE_SANGRAN = [
        '.mstage__bg--sangra',
        '.mstage__bg',
        '.mstage__sky-caja',
        '.result-m__planet-clip',
      ];

      // `nav.site-menu` NO está en la lista, y es a propósito. No es una capa
      // que sangra: en el diseño la píldora arranca a 24 px del borde del
      // frame, o sea que es un elemento CON MARGEN, y pertenece a la
      // composición —está en el mismo espacio de coordenadas que el logo y que
      // el botón, y los tres se mueven juntos—. Medido a 320: el logo queda a
      // 74,2 de cada borde, el botón a 74,9 y la píldora en la misma grilla.
      // Sacarla al viewport la despegaría de lo único con lo que tiene que
      // alinearse. Los 26 px que "pierde" no son un agujero: son la composición
      // centrada, que es lo que le pasa a cada elemento de adentro.
      const CON_MARGEN = ['nav.site-menu'];
      // Se mide CAPA POR CAPA y no el máximo entre todas: la copia de sangrado
      // del cielo llega al borde y taparía a las demás, que es justo lo que
      // esconde el problema. Lo que importa es cuánto le falta a CADA una.
      const capas = [];
      for (const sel of QUE_SANGRAN) {
        const el = document.querySelector(sel);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        const izq = +Math.max(0, r.left).toFixed(1);
        const der = +Math.max(0, W - r.right).toFixed(1);
        capas.push({ sel, izq, der, corta: izq > 0.5 || der > 0.5 });
      }
      for (const sel of CON_MARGEN) {
        const el = document.querySelector(sel);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        capas.push({
          sel: sel + ' (con margen, no sangra)',
          izq: +Math.max(0, r.left).toFixed(1),
          der: +Math.max(0, W - r.right).toFixed(1),
          corta: false,
        });
      }
      const cortas = capas.filter((c) => c.corta);
      const franja = {
        // el peor faltante entre las capas que tienen que sangrar
        izq: cortas.length ? Math.max(...cortas.map((c) => c.izq)) : 0,
        der: cortas.length ? Math.max(...cortas.map((c) => c.der)) : 0,
        cortas: cortas.map((c) => `${c.sel} ${c.izq}/${c.der}`),
        capas,
      };

      // ------------------------------------------- 2. el texto legible más chico
      const decorativo = (el) =>
        el.closest('[aria-hidden="true"]') ||
        el.closest('.sr-only') ||
        el.closest('.dev-switch') ||
        el.closest('[hidden]');
      let min = null;
      for (const el of document.querySelectorAll('body *')) {
        if (decorativo(el)) continue;
        // sólo elementos con texto propio, no contenedores
        const propio = [...el.childNodes]
          .filter((n) => n.nodeType === 3 && n.textContent.trim())
          .map((n) => n.textContent.trim())
          .join(' ');
        if (!propio) continue;
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) continue;
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        // Fuera de la pantalla: el «Saltar al contenido» vive en -9999 hasta
        // que recibe foco, y si contara sería el mínimo de media docena de
        // pantallas que en realidad no tienen ningún texto chico.
        if (r.right < 0 || r.left > W || r.bottom < 0) continue;
        const fs = parseFloat(cs.fontSize);
        if (!min || fs < min.fs) {
          min = {
            fs: +fs.toFixed(2),
            txt: propio.slice(0, 34),
            sel: el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).split(' ')[0] : ''),
          };
        }
      }

      const canvas = document.querySelector('.mstage__canvas');
      return {
        escala: canvas ? +(canvas.getBoundingClientRect().width / 402).toFixed(3) : null,
        franja,
        chico: min,
        vScroll: Math.max(0, document.documentElement.scrollHeight - window.innerHeight),
        hScroll: Math.max(0, document.documentElement.scrollWidth - W),
      };
    });

    filas.push({ ancho, alto, pantalla: nombre, ...m });
    await pagina.close();
  }
}

await navegador.close();

if (json) {
  console.log(JSON.stringify(filas, null, 1));
} else {
  for (const ancho of ANCHOS) {
    const grupo = filas.filter((f) => f.ancho === ancho);
    console.log(`\n=== ${ancho}x${ALTO[ancho] ?? 851}  ·  escala ${grupo[0].escala} ===`);
    console.log(
      '  pantalla'.padEnd(16) + 'franja izq/der'.padStart(16) + 'texto min'.padStart(11) + '  scroll   qué texto',
    );
    for (const f of grupo) {
      const franja = f.franja.cortas.length ? `${f.franja.izq}/${f.franja.der}` : '0/0';
      const sc = [f.vScroll ? `v+${f.vScroll}` : '', f.hScroll ? `H+${f.hScroll}` : ''].filter(Boolean).join(' ') || '—';
      console.log(
        `  ${f.pantalla.padEnd(14)}${franja.padStart(16)}${String(f.chico?.fs ?? '—').padStart(11)}  ${sc.padEnd(8)} ${f.chico?.txt ?? ''}`,
      );
    }
  }
  const peorFranja = Math.max(...filas.map((f) => Math.max(f.franja.izq, f.franja.der)));
  const peorTexto = Math.min(...filas.map((f) => f.chico?.fs ?? Infinity));
  console.log(`\n  Peor franja lateral: ${peorFranja} px · Texto legible más chico: ${peorTexto} px`);
}

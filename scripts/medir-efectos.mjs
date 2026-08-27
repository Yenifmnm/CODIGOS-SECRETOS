/**
 * Busca EFECTOS INVENTADOS: capas que pintan un resplandor, una sombra o un
 * desenfoque que su nodo del Figma no declara.
 *
 *   npm run dev                     # o BASE=https://... para el publicado
 *   node scripts/medir-efectos.mjs  # `npm run audit:efectos`
 *
 * De dónde sale: el logo de REGISTRO tenía
 * `filter: drop-shadow(0 0 3cqw rgba(9,234,255,.6))` y su nodo (73:553) declara
 * `efectos: null`. El resplandor estaba copiado del logo del LANDING (70:169,
 * que sí lleva dos de `0 0 250px #09EAFF`). La clienta lo vio como «un brillo
 * raro verde detrás de códigos secretos».
 *
 * `figma:check` no lo agarra: compara la CAJA, el color de relleno y el trazo,
 * y un `filter` no mueve la caja ni cambia el `color`. Un efecto de más es
 * exactamente el tipo de cosa que pasa las diez pantallas en ✓.
 *
 * QUÉ COMPARA. Del lado del CSS, tres propiedades: `filter`, `box-shadow` y
 * `text-shadow` (más `backdrop-filter`). Del lado del diseño, el array
 * `efectos` del nodo, donde Figma pone DROP_SHADOW, INNER_SHADOW, LAYER_BLUR y
 * BACKGROUND_BLUR. La pregunta es una sola: si la capa pinta, ¿el nodo declara?
 *
 * DOS TRAMPAS:
 *
 * 1. `text-shadow` SE HEREDA. Un `<span>` dentro de un título con resplandor
 *    devuelve el mismo `text-shadow` sin haberlo declarado. Sólo cuenta el
 *    elemento donde el valor CAMBIA respecto del padre, que es el que lo pone.
 * 2. **Lo que no está marcado no se puede comprobar.** La cobertura de
 *    `data-figma` ronda la mitad de las capas. Un efecto sobre un elemento sin
 *    marca no se puede confrontar con ningún nodo: va en su propia lista, y esa
 *    lista es la medida de hasta dónde llega este control. No leerla como «no
 *    hay más».
 */

import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const BASE = process.env.BASE ?? 'http://localhost:5180';
const PANTALLAS = JSON.parse(readFileSync('figma/nodes.json', 'utf8')).pantallas;

/** Mapa id → nodo de un spec, para resolver las marcas. */
function nodosDe(slug) {
  let spec;
  try {
    spec = JSON.parse(readFileSync(`figma/spec/${slug}.json`, 'utf8'));
  } catch {
    return null;
  }
  const mapa = new Map();
  const walk = (n) => {
    mapa.set(n.id, n);
    for (const h of n.hijos ?? []) walk(h);
  };
  walk(spec.arbol);
  return { mapa, frame: spec.frame };
}

/* Qué tipo de efecto de Figma cubre cada propiedad de CSS. Un `filter` puede
   traer varias funciones a la vez, así que se mira por función. */
const SOMBRA = ['DROP_SHADOW', 'INNER_SHADOW'];
const EQUIVALE = {
  'filter:drop-shadow': SOMBRA,
  'filter:blur': ['LAYER_BLUR'],
  'backdrop-filter:blur': ['BACKGROUND_BLUR'],
  'box-shadow': SOMBRA,
  'text-shadow': SOMBRA,
};

/** Lo que pinta cada elemento, leído del navegador. */
const RECOGER = () => {
  const vivo = (v) => v && v !== 'none';

  /* Una sombra declarada no siempre pinta. `rgba(9,234,255,0) 0 0 0 0` está en
     varias reglas como estado de partida de una transición: alfa 0 y todas las
     medidas en cero, o sea nada en pantalla. Contarla como efecto inventado es
     ruido, y ruido que tapa los hallazgos de verdad. Se parten las capas por
     comas de primer nivel —adentro hay comas, las de `rgba()`— y sobrevive la
     que tenga alfa y alguna medida distinta de cero. */
  const pintaSombra = (v) => {
    const capas = [];
    let d = 0;
    let acc = '';
    for (const ch of v) {
      if (ch === '(') d++;
      if (ch === ')') d--;
      if (ch === ',' && d === 0) { capas.push(acc); acc = ''; continue; }
      acc += ch;
    }
    capas.push(acc);
    return capas.some((capa) => {
      const alfa = capa.match(/rgba\([^)]*,\s*([\d.]+)\s*\)/);
      if (alfa && parseFloat(alfa[1]) === 0) return false;
      const medidas = capa.replace(/\([^)]*\)/g, '').match(/-?[\d.]+px/g) ?? [];
      return medidas.some((m) => parseFloat(m) !== 0);
    });
  };
  const out = [];
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el);
    const padre = el.parentElement ? getComputedStyle(el.parentElement) : null;
    const r = el.getBoundingClientRect();
    const pinta = [];

    // Una entrada por PROPIEDAD. Un `filter` con dos `drop-shadow()` es un
    // efecto declarado dos veces, no dos hallazgos distintos.
    if (vivo(cs.filter)) {
      if (/drop-shadow\(/.test(cs.filter)) {
        pinta.push(['filter:drop-shadow', cs.filter]);
      } else if (/brightness\(0\)\s+invert\(1\)\s+blur\(/.test(cs.filter)) {
        /* `brightness(0) invert(1) blur(R)` NO es un desenfoque de capa: es el
           resplandor de un nodo dibujado SIN la capa encima —la silueta pasada
           a blanco y desparramada—, o sea la misma sombra que
           `drop-shadow(0 0 2R #FFF)`. Cuenta como DROP_SHADOW. Si no se
           distinguiera, las tres capas `*-ship-halo` saldrían listadas como
           efecto inventado justo después de haberlas arreglado.
           `figma-check.mjs` hace la misma traducción al comparar sombras. */
        pinta.push(['filter:drop-shadow', cs.filter]);
      } else if (/\bblur\(/.test(cs.filter)) {
        pinta.push(['filter:blur', cs.filter]);
      }
    }
    if (vivo(cs.backdropFilter) && /blur\(/.test(cs.backdropFilter)) {
      pinta.push(['backdrop-filter:blur', cs.backdropFilter]);
    }
    if (vivo(cs.boxShadow) && pintaSombra(cs.boxShadow)) pinta.push(['box-shadow', cs.boxShadow]);
    /* Heredado: sólo cuenta donde el valor cambia respecto del padre. Ese es el
       elemento que lo declara; los hijos lo devuelven por herencia. */
    if (
      vivo(cs.textShadow) &&
      pintaSombra(cs.textShadow) &&
      (!padre || padre.textShadow !== cs.textShadow)
    ) {
      pinta.push(['text-shadow', cs.textShadow]);
    }
    if (!pinta.length) continue;

    // La marca propia, o la del ancestro más cercano que tenga una.
    let marca = el.getAttribute('data-figma');
    let heredada = null;
    if (!marca) {
      let a = el.parentElement;
      while (a && a !== document.body && !heredada) {
        if (a.getAttribute('data-figma')) heredada = a.getAttribute('data-figma');
        a = a.parentElement;
      }
    }
    out.push({
      sel:
        el.tagName.toLowerCase() +
        (el.className && typeof el.className === 'string'
          ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.')
          : ''),
      marca,
      heredada,
      omitir: el.getAttribute('data-figma-omitir'),
      visible: r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.opacity !== '0',
      pinta,
    });
  }
  return out;
};

const navegador = await chromium.launch(
  process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {},
);

const inventados = [];
const sinMarca = [];
const faltantes = [];
let comprobados = 0;
const pantallasVistas = [];

for (const [slug, cfg] of Object.entries(PANTALLAS)) {
  if (!slug.endsWith('-mobile')) continue;   // el spec de escritorio no tiene ruta propia
  const spec = nodosDe(slug);
  if (!spec) continue;

  const pagina = await navegador.newPage({
    viewport: { width: spec.frame.w, height: spec.frame.h - 62 },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  });
  await pagina.goto(`${BASE}/${cfg.ruta ?? '#/'}`, { waitUntil: 'networkidle' });
  await pagina.addStyleTag({
    content: '*,*::before,*::after{animation:none!important;transition:none!important}',
  });
  if (slug === 'menu-mobile') {
    await pagina.getByRole('button', { name: /Abrir menú/i }).click();
    await pagina.waitForTimeout(400);
  }
  await pagina.evaluate(() => document.fonts.ready);
  await pagina.waitForTimeout(500);

  const capas = await pagina.evaluate(RECOGER);
  await pagina.close();
  pantallasVistas.push(slug);

  for (const c of capas) {
    if (!c.visible) continue;

    /* La marca puede traer varios id separados por espacio, uno por pantalla
       donde vive el componente. Gana el que exista en ESTE spec. */
    const ids = (c.marca ?? '').split(/\s+/).filter(Boolean);
    const id = ids.find((i) => spec.mapa.has(i));
    const nodo = id ? spec.mapa.get(id) : null;

    if (!nodo) {
      sinMarca.push({ slug, ...c, motivo: c.marca ? 'la marca no es de este frame' : 'sin data-figma' });
      continue;
    }
    const tiene = new Set((nodo.efectos ?? []).map((e) => e.tipo));
    for (const [prop, valor] of c.pinta) {
      comprobados++;
      const esperados = EQUIVALE[prop] ?? [];
      if (!esperados.some((t) => tiene.has(t))) {
        inventados.push({ slug, id, nombre: nodo.nombre, tipo: nodo.tipo, ...c, prop, valor, tiene: [...tiene] });
      }
    }
    // El camino contrario: el nodo declara y la capa no pinta.
    const pintados = new Set(c.pinta.flatMap(([p]) => EQUIVALE[p] ?? []));
    for (const t of tiene) {
      if (!pintados.has(t)) faltantes.push({ slug, id, nombre: nodo.nombre, tipo: t });
    }
  }
}

await navegador.close();

const corta = (v, n = 62) => (v.length > n ? v.slice(0, n - 1) + '…' : v);

/* Agrupado por (selector, propiedad, valor): la barra del menú es UN componente
   que aparece en las once pantallas, no once hallazgos. Lo que importa es la
   regla de CSS a corregir, y esa es una sola. */
console.log(`\n  EFECTOS INVENTADOS — la capa pinta, el nodo no lo declara\n`);
const porRegla = new Map();
for (const i of inventados) {
  const k = `${i.sel}|${i.prop}|${i.valor}`;
  if (!porRegla.has(k)) porRegla.set(k, { ...i, donde: [] });
  porRegla.get(k).donde.push(`${i.slug} ${i.id}`);
}
if (!porRegla.size) {
  console.log('  (ninguno)');
} else {
  let n = 0;
  for (const i of [...porRegla.values()].sort((a, b) => b.donde.length - a.donde.length)) {
    console.log(
      `  ${++n}. ${i.sel}   ${i.prop}\n` +
        `      pinta:  ${corta(i.valor, 74)}\n` +
        `      nodo:   «${i.nombre}» (${i.tipo}) declara ${i.tiene.length ? i.tiene.join(', ') : 'efectos: null'}` +
        `${i.omitir ? `   [data-figma-omitir="${i.omitir}"]` : ''}\n` +
        `      en ${i.donde.length}: ${i.donde.slice(0, 4).join(', ')}${i.donde.length > 4 ? `, +${i.donde.length - 4}` : ''}`,
    );
  }
}

console.log(`\n  NO COMPROBABLES — pintan un efecto y no hay nodo contra el cual mirarlo\n`);
const agrup = new Map();
for (const c of sinMarca) {
  const k = `${c.slug}|${c.sel}|${c.pinta.map(([p]) => p).join(',')}`;
  if (!agrup.has(k)) agrup.set(k, c);
}
for (const c of agrup.values()) {
  console.log(
    `  ? ${c.slug.padEnd(26)} ${c.sel.slice(0, 40).padEnd(41)} ${c.pinta.map(([p]) => p).join(', ')}` +
      `${c.heredada ? `   · dentro de ${c.heredada}` : ''}`,
  );
}

console.log(
  `\n  ${comprobados} efecto(s) comprobados contra su nodo en ${pantallasVistas.length} pantallas. ` +
    `${porRegla.size} regla(s) inventada(s), en ${inventados.length} capa(s).\n` +
    `  ${agrup.size} capa(s) pintan un efecto sin marca que permita comprobarlo: ` +
    `este control llega hasta ahí.\n` +
    `  ${faltantes.length} efecto(s) del diseño que ninguna capa marcada pinta.`,
);
process.exit(0);

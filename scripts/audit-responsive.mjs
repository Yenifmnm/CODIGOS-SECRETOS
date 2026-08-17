/**
 * Auditoría de responsive mobile.
 *
 *   npm run dev                 # en otra terminal
 *   npm run audit:responsive
 *
 * Recorre las 10 rutas del sitio en 17 viewports —de 320x568 a 430x932, más
 * tres con el alto recortado para simular el teclado abierto y uno en
 * landscape— y verifica en cada combinación:
 *
 *   · que no haya scroll horizontal, señalando qué elemento lo provoca;
 *   · que ningún input baje de 16px, que es lo que dispara el zoom automático
 *     de Safari iOS al enfocar un campo;
 *   · que los controles tengan un área táctil de al menos 40px;
 *   · que ningún texto se desborde de su caja;
 *   · que no haya errores de JavaScript.
 *
 * Requiere Playwright, que NO es dependencia del proyecto para no engordar el
 * despliegue. Se instala a demanda:
 *
 *   npm i -D playwright && npx playwright install chromium
 *
 * SHOTS=1 guarda además una captura de cada combinación.
 */

import { chromium } from 'playwright';
import fs from 'fs';

const OUT = process.env.OUT ?? 'audit-shots';
fs.mkdirSync(OUT, { recursive: true });
const BASE = process.env.BASE ?? 'http://localhost:5180';
const shots = process.env.SHOTS === '1';

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

const VIEWPORTS = [
  [320, 568], [360, 640], [360, 800], [375, 667], [375, 812], [384, 848],
  [390, 844], [393, 852], [402, 874], [412, 892], [412, 915], [414, 896], [430, 932],
  // Teclado abierto: alto útil reducido.
  [390, 420], [430, 500], [360, 380],
  // Landscape.
  [844, 390],
];

const TOLERANCIA = 1;
const fallos = [];

async function auditar(page, ruta, w, h) {
  const problemas = [];
  const r = await page.evaluate(() => {
    const de = document.documentElement;
    const out = {
      scrollW: de.scrollWidth, clientW: de.clientWidth,
      scrollH: de.scrollHeight, clientH: de.clientHeight,
      culpables: [], inputsChicos: [], fueraDeVista: [], textoDesbordado: [],
    };
    // Quién genera overflow horizontal
    if (de.scrollWidth > de.clientWidth + 1) {
      for (const el of document.querySelectorAll('body *')) {
        const b = el.getBoundingClientRect();
        if (b.width === 0 || b.height === 0) continue;
        if (b.right > de.clientWidth + 1 || b.left < -1) {
          const cs = getComputedStyle(el);
          if (cs.position === 'absolute' || cs.position === 'fixed') continue; // decoración
          out.culpables.push(`${el.tagName}.${(el.className || '').toString().slice(0, 40)} right=${Math.round(b.right)}`);
        }
      }
    }
    // Inputs con menos de 16px: Safari iOS hace zoom al enfocar
    for (const i of document.querySelectorAll('input, select, textarea')) {
      const fs = parseFloat(getComputedStyle(i).fontSize);
      if (fs < 16) out.inputsChicos.push(`${i.name || i.type}=${fs.toFixed(1)}px`);
    }
    // Elementos funcionales alcanzables dentro del documento
    const oculto = (el) => el.closest('.sr-only, .skip-link') || el.classList.contains('sr-only') || el.classList.contains('skip-link');
    for (const el of document.querySelectorAll('button, a[href], input')) {
      const b = el.getBoundingClientRect();
      if (b.width === 0 || b.height === 0 || oculto(el)) continue;
      if (b.width <= 2 && b.height <= 2) continue;
      const top = b.top + window.scrollY, bot = b.bottom + window.scrollY;
      if (bot > de.scrollHeight + 2 || top < -2) {
        out.fueraDeVista.push(`${el.tagName}.${(el.className || '').toString().slice(0, 30)}`);
      }
    }
    // Texto que se sale de su caja
    for (const el of document.querySelectorAll('p, h1, h2, h3, span, label')) {
      if (el.children.length || oculto(el)) continue;
      const cs2 = getComputedStyle(el);
      if (cs2.overflow === 'auto' || cs2.overflowX === 'auto' || cs2.whiteSpace === 'nowrap') continue;
      if (el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 0) {
        out.textoDesbordado.push(`${el.tagName}.${(el.className || '').toString().slice(0, 30)}`);
      }
    }
    // Botones funcionales demasiado chicos para el dedo
    out.tactilChico = [];
    for (const el of document.querySelectorAll('button, a[href]')) {
      if (oculto(el) || el.closest('.dev-switch')) continue;   // panel de desarrollo
      const b = el.getBoundingClientRect();
      if (b.width === 0 || b.height === 0) continue;
      let alto = b.height, ancho = b.width;
      const after = getComputedStyle(el, '::after');
      if (after && after.content !== 'none' && after.position === 'absolute') {
        const ins = (v) => parseFloat(v) || 0;
        alto = Math.max(alto, parseFloat(after.height) || (b.height - ins(after.top) - ins(after.bottom)));
        ancho = Math.max(ancho, parseFloat(after.width) || (b.width - ins(after.left) - ins(after.right)));
      }
      if (alto < 40 || ancho < 40) out.tactilChico.push(`${(el.className||'').toString().slice(0,26)}=${Math.round(ancho)}x${Math.round(alto)}`);
    }
    return out;
  });

  if (r.scrollW > r.clientW + TOLERANCIA) {
    problemas.push(`overflow-x ${r.scrollW}>${r.clientW}${r.culpables.length ? ' por ' + r.culpables.slice(0, 3).join(', ') : ''}`);
  }
  if (r.inputsChicos.length) problemas.push(`inputs <16px: ${r.inputsChicos.join(', ')}`);
  if (r.fueraDeVista.length) problemas.push(`fuera del documento: ${r.fueraDeVista.slice(0, 3).join(', ')}`);
  if (r.textoDesbordado.length) problemas.push(`texto desbordado: ${r.textoDesbordado.slice(0, 3).join(', ')}`);
  if (r.tactilChico?.length) problemas.push(`area tactil <40px: ${r.tactilChico.slice(0, 3).join(', ')}`);
  return problemas;
}

const browser = await chromium.launch({ channel: process.env.CHANNEL ?? 'chrome' });
let total = 0, conFallo = 0;

for (const [w, h] of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: w < 900, deviceScaleFactor: 1 });
  for (const [nombre, ruta] of RUTAS) {
    const page = await ctx.newPage();
    const jsErr = [];
    page.on('pageerror', (e) => jsErr.push(e.message));
    await page.goto(`${BASE}/${ruta}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(900);
    const problemas = await auditar(page, ruta, w, h);
    if (jsErr.length) problemas.push(`JS: ${jsErr[0].slice(0, 60)}`);
    total++;
    if (problemas.length) {
      conFallo++;
      fallos.push(`${String(w).padStart(3)}x${String(h).padEnd(3)} ${nombre.padEnd(12)} ${problemas.join(' | ')}`);
    }
    if (shots) await page.screenshot({ path: `${OUT}/${w}x${h}-${nombre}.png` });
    await page.close();
  }
  await ctx.close();
}
await browser.close();

console.log(`\n${'='.repeat(70)}`);
console.log(`AUDITORÍA: ${total} combinaciones (${VIEWPORTS.length} tamaños x ${RUTAS.length} rutas)`);
console.log(`${total - conFallo} OK · ${conFallo} con problemas`);
if (fallos.length) {
  console.log(`${'='.repeat(70)}`);
  const agrupado = {};
  for (const f of fallos) {
    const clave = f.replace(/^\s*\d+x\d+\s+/, '').replace(/\s+/g, ' ');
    (agrupado[clave] ??= []).push(f.slice(0, 8).trim());
  }
  for (const [clave, tam] of Object.entries(agrupado).sort((a, b) => b[1].length - a[1].length)) {
    console.log(`\n[${tam.length}x] ${clave}`);
    console.log(`      en: ${tam.slice(0, 6).join(', ')}${tam.length > 6 ? ' …' : ''}`);
  }
}

process.exit(conFallo > 0 ? 1 : 0);

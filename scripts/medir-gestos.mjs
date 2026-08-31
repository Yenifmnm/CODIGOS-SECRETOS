/**
 * Comprueba que el dedo pueda SCROLLEAR encima de cada zona interactiva.
 *
 *   npm run dev                    # o BASE=https://... para el publicado
 *   node scripts/medir-gestos.mjs
 *
 * Por qué existe: `figma:check` compara cajas y color. No mira un gesto, igual
 * que no mira un estado ni una animación. Un elemento con `touch-action: none`
 * en el medio de la pantalla deja la página sin scroll en un teléfono, y las
 * diez pantallas siguen dando ✓ con 0 desvíos.
 *
 * Pasó con el catalejo de `/donde-esta-el-codigo`: 271x443 en el centro, el 43%
 * de la altura, justo donde va el pulgar.
 *
 * DOS DETALLES QUE CAMBIAN EL RESULTADO:
 *
 * 1. El gesto se dispara por CDP (`Input.dispatchTouchEvent`) y no con el
 *    mouse. Con un puntero de mouse la página scrollea igual y el defecto no
 *    aparece: un contexto sin `hasTouch` no lo ve.
 *
 * 2. No alcanza con mirar `window.scrollY`. En `bases` el swipe mueve la hoja
 *    interna y no la ventana, y eso está BIEN — es el scroll propio del
 *    diseño. Por eso se pregunta qué se movió, y no si se movió la ventana.
 *    La primera versión de este script contaba `bases` como falla.
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
const ctx = await navegador.newContext({
  viewport: { width: 402, height: 700 },
  deviceScaleFactor: 1,
  isMobile: true,
  hasTouch: true,
  reducedMotion: 'reduce',
});

/** Anota el scroll de la ventana y el de todo lo que scrollee por dentro. */
const FOTO = () => {
  const cajas = [document.scrollingElement, ...document.querySelectorAll('body *')].filter(
    (e) => e && e.scrollHeight - e.clientHeight > 8,
  );
  return cajas.map((e) => ({
    sel:
      e === document.scrollingElement
        ? 'la página'
        : e.tagName.toLowerCase() + '.' + String(e.className).split(' ')[0],
    top: e.scrollTop,
  }));
};

let fallas = 0;

for (const [nombre, ruta] of RUTAS) {
  const p = await ctx.newPage();
  await p.goto(`${BASE}/${ruta}`, { waitUntil: 'networkidle' });
  await p.addStyleTag({
    content: '*,*::before,*::after{animation:none!important;transition:none!important}',
  });
  await p.waitForTimeout(500);

  // Quién se queda el gesto, aunque no bloquee: saberlo es media diagnosis.
  const zonas = await p.evaluate(() => {
    const W = document.documentElement.clientWidth;
    const H = window.innerHeight;
    return [...document.querySelectorAll('body *')]
      .filter((e) => {
        const ta = getComputedStyle(e).touchAction;
        if (ta === 'auto' || ta === 'manipulation') return false;
        const r = e.getBoundingClientRect();
        return r.width >= 20 && r.height >= 20;
      })
      .map((e) => {
        const r = e.getBoundingClientRect();
        return (
          `${e.tagName.toLowerCase()}.${String(e.className).split(' ')[0]}` +
          ` [${getComputedStyle(e).touchAction}] ${Math.round((100 * r.width * r.height) / (W * H))}%`
        );
      });
  });

  const hay = await p.evaluate(FOTO);
  if (!hay.length) {
    console.log(`  – ${nombre.padEnd(13)} no hay nada que scrollear`);
    await p.close();
    continue;
  }

  const cdp = await ctx.newCDPSession(p);
  const swipe = async (x, y, dx, dy) => {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    for (let i = 1; i <= 10; i++) {
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: x + (dx * i) / 10, y: y + (dy * i) / 10 }],
      });
      await p.waitForTimeout(16);
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await p.waitForTimeout(450);
  };

  // Swipe vertical en el centro de la pantalla, que es donde va el pulgar.
  const antes = await p.evaluate(FOTO);
  const centro = Math.round(700 / 2);
  await swipe(201, centro + 130, 0, -260);
  const despues = await p.evaluate(FOTO);

  const movidos = despues
    .map((d, i) => ({ sel: d.sel, delta: Math.round(d.top - (antes[i]?.top ?? 0)) }))
    .filter((d) => d.delta > 15);

  const bloquea = movidos.length === 0;
  if (bloquea) fallas++;
  console.log(
    `  ${bloquea ? '✗' : '✓'} ${nombre.padEnd(13)} ` +
      (bloquea
        ? 'el swipe vertical NO scrollea nada'
        : `scrollea ${movidos.map((m) => `${m.sel} +${m.delta}px`).join(', ')}`) +
      (zonas.length ? `\n      se quedan el gesto: ${zonas.join(', ')}` : ''),
  );

  // Contraprueba del catalejo: el arrastre horizontal tiene que seguir
  // moviendo el lente. Si el arreglo del scroll lo dejara quieto, la pantalla
  // pasaría este control y la lupa no serviría para nada.
  if (nombre === 'codigo') {
    const caja = await p.locator('.telescope__viewport').boundingBox();
    const lente = p.locator('.telescope__lens');
    const t0 = await lente.evaluate((el) => getComputedStyle(el).transform);
    await swipe(caja.x + caja.width * 0.25, caja.y + caja.height / 2, caja.width * 0.5, 0);
    const t1 = await lente.evaluate((el) => getComputedStyle(el).transform);
    const ok = t0 !== t1;
    if (!ok) fallas++;
    console.log(
      `  ${ok ? '✓' : '✗'} ${'  · el lente'.padEnd(13)} el arrastre horizontal ${ok ? 'lo mueve' : 'YA NO LO MUEVE'}` +
        `\n      ${t0}  ->  ${t1}`,
    );
  }

  await p.close();
}

await navegador.close();
console.log(
  fallas
    ? `\n  ${fallas} problema(s) de gesto.`
    : '\n  En todas se scrollea con el dedo en el centro, y el catalejo sigue arrastrándose.',
);
process.exit(0);

/**
 * Cuánto tarda la landing en pintar, contra el build PUBLICADO.
 *
 *   node scripts/medir-carga.mjs                              # el publicado
 *   BASE=http://localhost:4173 node scripts/medir-carga.mjs   # `npm run preview`
 *
 * NO sirve medir esto contra `npm run dev`: Vite sirve los módulos sueltos y da
 * 111 pedidos donde el build hace 17.
 *
 * TRES COSAS QUE HAY QUE HACER BIEN O EL NÚMERO NO MIDE NADA:
 *
 * 1. El fin de descarga sale de RESOURCE TIMING (`responseEnd`), no del evento
 *    `response` de Playwright: ése dispara cuando llegan las CABECERAS, así que
 *    daba 814 ms para imágenes que en realidad tardaban el triple.
 * 2. El LCP necesita un `PerformanceObserver` puesto ANTES de navegar. Leerlo
 *    después con `getEntriesByType` devuelve vacío.
 * 3. Sin estrangular la red, todo entra a la vez y cualquier cambio de
 *    prioridad da lo mismo. Acá se emula 4 Mbps con 150 ms de latencia y la CPU
 *    a un cuarto, que es un teléfono de gama media en una red real.
 *
 * Cada corrida hace N pasadas con caché limpia y toma la MEDIANA: contra un CDN
 * una sola pasada varía más que el efecto que se quiere medir.
 */

import { chromium } from 'playwright';

const BASE = process.env.BASE ?? 'https://yenifmnm.github.io/CODIGOS-SECRETOS';
const RUTA = process.env.RUTA ?? '#/';
const PASADAS = Number(process.env.PASADAS ?? 5);
const RED = {
  offline: false,
  downloadThroughput: (4 * 1024 * 1024) / 8,
  uploadThroughput: (1024 * 1024) / 8,
  latency: 150,
};

const mediana = (a) => {
  const s = a.filter((x) => x != null).sort((x, y) => x - y);
  return s.length ? s[Math.floor(s.length / 2)] : null;
};

const filas = [];

for (let i = 0; i < PASADAS; i++) {
  const nav = await chromium.launch();
  const ctx = await nav.newContext({ viewport: { width: 402, height: 851 }, deviceScaleFactor: 2 });
  // El observador de LCP tiene que existir antes del primer byte.
  await ctx.addInitScript(() => {
    window.__lcp = 0;
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) window.__lcp = e.startTime;
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  });
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', RED);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });

  await p.goto(`${BASE}/${RUTA}`, { waitUntil: 'load' });
  await p.waitForTimeout(6000);

  const m = await p.evaluate(() => {
    const n = performance.getEntriesByType('navigation')[0];
    const rec = {};
    for (const r of performance.getEntriesByType('resource')) {
      if (!/\.(webp|png|jpg|otf|woff2?)(\?|$)/.test(r.name)) continue;
      const clave = r.name.split('/').pop().replace(/-[A-Za-z0-9_-]{8}\./, '.');
      // `responseEnd` es cuando termino de bajar; `startTime`, cuando el
      // navegador la DESCUBRIO. La segunda es la que mueve un preload.
      rec[clave] = { fin: Math.round(r.responseEnd), inicio: Math.round(r.startTime) };
    }
    return {
      fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? null,
      lcp: window.__lcp || null,
      dcl: n?.domContentLoadedEventEnd ?? null,
      load: n?.loadEventEnd ?? null,
      rec,
    };
  });
  filas.push(m);
  await nav.close();
}

const num = (k) => Math.round(mediana(filas.map((f) => f[k])));
console.log(`\n  ${BASE}/${RUTA}   ${PASADAS} pasadas, caché limpia, 4 Mbps · 150 ms · CPU ×4\n`);
console.log(`     primer pintado (FCP) ....... ${num('fcp')} ms`);
console.log(`     pintado mayor (LCP) ........ ${num('lcp')} ms`);
console.log(`     DOM listo .................. ${num('dcl')} ms`);
console.log(`     load ....................... ${num('load')} ms`);

const claves = [...new Set(filas.flatMap((f) => Object.keys(f.rec)))];
const orden = claves
  .map((k) => ({
    k,
    ini: mediana(filas.map((f) => f.rec[k]?.inicio)),
    fin: mediana(filas.map((f) => f.rec[k]?.fin)),
  }))
  .sort((a, b) => a.ini - b.ini);
console.log('\n     imagen                        se descubre    termina');
for (const o of orden) {
  console.log(
    `     ${o.k.slice(0, 28).padEnd(29)} ${String(o.ini + ' ms').padStart(9)}  ${String(o.fin + ' ms').padStart(9)}`,
  );
}
process.exit(0);

/**
 * Busca costuras verticales en el render, POR PÍXELES.
 *
 *   npm run dev                          # o BASE=https://... para el publicado
 *   node scripts/medir-costuras.mjs
 *   node scripts/medir-costuras.mjs --anchos 360 --pantallas premios
 *
 * Por qué existe, y por qué no alcanzaba `medir-anchos.mjs`:
 *
 * `medir-anchos.mjs` mide una LISTA CURADA de selectores —«estas capas tienen
 * que llegar al borde»— y por lo tanto no puede ver una costura que la deje una
 * capa que no está en la lista. Eso ya pasó: con la lista en cero, en un
 * teléfono real seguía viéndose una banda a cada lado, porque el resplandor del
 * carrusel de PREMIOS y los de las escenas de resultado también son capas del
 * ancho del LIENZO y ninguna estaba anotada.
 *
 * Esto no pregunta qué capas hay: mira el bitmap. Para cada columna calcula
 * cuánto se diferencia de la que tiene al lado, promediado sobre las filas, y
 * marca los picos. Un pico a 29 px del borde en una pantalla de 360 es la
 * costura del lienzo, la deje quien la deje.
 */

import { chromium } from 'playwright';

const BASE = process.env.BASE ?? 'http://localhost:5180';

const args = process.argv.slice(2);
const bandera = (n) => {
  const i = args.indexOf(n);
  return i === -1 ? null : args[i + 1] ?? null;
};
const ANCHOS = (bandera('--anchos') ?? '320,360,375,390,402,430').split(',').map(Number);
const ALTO = { 320: 568, 360: 640, 375: 667, 390: 844, 402: 874, 412: 915, 430: 932 };

const TODAS = [
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
const pedidas = bandera('--pantallas')?.split(',');
const RUTAS = pedidas ? TODAS.filter(([n]) => pedidas.includes(n)) : TODAS;

/* Cuánto tiene que saltar una columna respecto de la de al lado para contar como
   costura. Sobre 0-255 por canal: 6 deja pasar los degradados del cielo y marca
   los bordes duros de una capa que se corta. */
const UMBRAL = Number(process.env.UMBRAL ?? 6);

const navegador = await chromium.launch(
  process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {},
);

let conCostura = 0;

for (const ancho of ANCHOS) {
  const alto = ALTO[ancho] ?? 851;
  console.log(`\n=== ${ancho}x${alto} ===`);
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
    await pagina.waitForTimeout(400);

    // `.toString('base64')` explícito: `screenshot()` devuelve un Buffer y la
    // opción `encoding` ya no existe. Pasar el Buffer a `evaluate` lo serializa
    // mal y del otro lado `atob` recibe algo que no es base64.
    const captura = (await pagina.screenshot()).toString('base64');
    const lienzo = await pagina.evaluate(() => {
      const c = document.querySelector('.mstage__canvas');
      if (!c) return null;
      const r = c.getBoundingClientRect();
      return { izq: +r.left.toFixed(1), der: +(document.documentElement.clientWidth - r.right).toFixed(1) };
    });

    // El análisis del bitmap va en una página EN BLANCO, no en la que se está
    // midiendo: pasarle el PNG entero por el puente a una página con toda la
    // app cargada la ahoga y la promesa se pierde.
    const lupa = await navegador.newPage();
    await lupa.setContent('<!doctype html><title>lupa</title>');
    const picos = await lupa.evaluate(
      async ([b64, umbral]) => {
        // `createImageBitmap` sobre un Blob y no un `<img src="data:...">`: la
        // data URL de una captura entera no la carga.
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
        const W = img.width;
        const H = img.height;

        // Diferencia media entre la columna i y la i+1, sobre todas las filas.
        const salto = new Array(W - 1).fill(0);
        for (let i = 0; i < W - 1; i++) {
          let suma = 0;
          for (let y = 0; y < H; y += 2) {
            const a = (y * W + i) * 4;
            const b = (y * W + i + 1) * 4;
            suma += Math.max(
              Math.abs(d[a] - d[b]),
              Math.abs(d[a + 1] - d[b + 1]),
              Math.abs(d[a + 2] - d[b + 2]),
            );
          }
          salto[i] = suma / Math.ceil(H / 2);
        }
        return salto
          .map((v, i) => ({ x: i + 0.5, v: +v.toFixed(2) }))
          .filter((p) => p.v >= umbral)
          .sort((a, b) => b.v - a.v)
          .slice(0, 6);
      },
      [captura, UMBRAL],
    );
    await lupa.close();

    const cerca = (p) =>
      lienzo && (Math.abs(p.x - lienzo.izq) <= 2 || Math.abs(p.x - (ancho - lienzo.der)) <= 2);
    const delLienzo = picos.filter(cerca);
    if (delLienzo.length) conCostura++;

    const detalle = picos.length
      ? picos.map((p) => `x=${p.x}${cerca(p) ? '*' : ''} (${p.v})`).join('  ')
      : 'ninguna';
    console.log(
      `  ${nombre.padEnd(13)} lienzo ${String(lienzo?.izq ?? '?').padStart(5)}..${String(ancho - (lienzo?.der ?? 0)).padStart(5)}   ` +
        `${delLienzo.length ? 'COSTURA' : '   ok  '}  ${detalle}`,
    );
    await pagina.close();
  }
}

await navegador.close();
console.log(
  `\n  ${conCostura} combinación(es) con una costura sobre el borde del lienzo.` +
    ' El `*` marca los picos que caen ahí; los demás son bordes legítimos de la composición.',
);
process.exit(0);

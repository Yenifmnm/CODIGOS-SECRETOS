/**
 * Compara lo que renderiza el sitio contra el diseño de Figma, con números.
 *
 *   npm run dev                    # en otra terminal
 *   node scripts/figma-check.mjs registro-mobile
 *   node scripts/figma-check.mjs --all
 *
 * Hace tres comprobaciones distintas, y las tres importan:
 *
 * 1. CAPA POR CAPA (la que arregla el "no queda igual"). Cada elemento del DOM
 *    marcado con `data-figma="23:3163"` se mide con getBoundingClientRect y se
 *    compara contra la posición y el tamaño que tiene ese mismo nodo en
 *    `figma/spec/<slug>.json`. Sale una tabla de desvíos en px: "el pergamino
 *    está 14 px más abajo y 6% más chico". Eso es accionable; una captura no.
 *
 * 2. AL REVÉS, QUÉ FALTA. La comprobación 1 recorre el DOM, así que sólo puede
 *    hablar de lo que ya está marcado: una capa del diseño que nadie escribió no
 *    está en el DOM y por lo tanto no existe para el reporte — la pantalla da ✓
 *    con 0 desvíos igual. Esta recorre el SPEC en la dirección contraria y lista
 *    cada capa que pinta algo y no tiene contraparte marcada. Es el agujero por
 *    el que las dos cintas del titular de REGISTRO pasaron sin que nada las
 *    comparara nunca.
 *
 * 3. PÍXEL A PÍXEL. Saca la captura de la ruta en el viewport del frame y la
 *    compara contra el PNG de referencia. Escribe tres imágenes en
 *    `figma/check/<slug>/`: la captura, el diff en rojo y el overlay
 *    (el diseño encima del render al 50%, para mirar a ojo).
 *
 * Salida: `figma/check/<slug>/reporte.md` y un resumen en consola. Devuelve
 * código 1 si algún desvío pasa la tolerancia, así sirve en CI.
 *
 * Requiere Playwright, que NO es dependencia del proyecto para no engordar el
 * despliegue —igual que scripts/audit-responsive.mjs—. Se instala a demanda:
 *
 *   npm i -D playwright && npx playwright install chromium
 *
 * El diff de imágenes se hace con canvas dentro del propio navegador, así que
 * no hace falta ninguna librería de imagen.
 */

import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const RAIZ = path.resolve(import.meta.dirname, '..');
const MAPA = path.join(RAIZ, 'figma', 'nodes.json');
const SPEC = path.join(RAIZ, 'figma', 'spec');
const SALIDA = path.join(RAIZ, 'figma', 'check');

const BASE = process.env.BASE ?? 'http://localhost:5180';
const TOLERANCIA = Number(process.env.TOL ?? 2); // px
const UMBRAL_PIXEL = Number(process.env.UMBRAL ?? 32); // 0-255 por canal

const args = process.argv.slice(2);
const todos = args.includes('--all');
const pedidos = args.filter((a) => !a.startsWith('--'));

if (!fs.existsSync(MAPA)) salir(`No existe ${path.relative(RAIZ, MAPA)}.`);
const mapa = JSON.parse(fs.readFileSync(MAPA, 'utf8'));

// Tipografías que el sitio reemplaza a propósito. El spec dice la del diseño;
// si acá figura una sustituta, el control acepta cualquiera de las dos. Sirve
// para cuando la licenciada no se puede usar en la web: sin esto, cada texto de
// cada pantalla saldría en rojo para siempre y el control se vuelve ruido. Con
// esto sigue detectando que un texto caiga en una TERCERA fuente.
const SUSTITUCIONES = mapa.tipografias ?? {};

const pantallas = Object.entries(mapa.pantallas ?? {})
  .map(([slug, v]) => ({ slug, ...(typeof v === 'string' ? { node: v } : v) }))
  .filter((p) => p.ruta != null);

const objetivo = todos ? pantallas : pantallas.filter((p) => pedidos.includes(p.slug));
if (!objetivo.length) {
  salir(`Pasá el slug de una pantalla o --all.\n\nDisponibles: ${pantallas.map((p) => p.slug).join(', ')}`);
}

// CHROMIUM=/ruta/al/binario sirve si ya tenés un Chromium instalado y no
// querés que Playwright se baje el suyo.
const navegador = await chromium.launch(
  process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {},
);
let fallas = 0;
let sinSpec = 0;
let pintanTotal = 0;
let sinMarcaTotal = 0;

for (const pantalla of objetivo) {
  const dir = path.join(SALIDA, pantalla.slug);
  fs.mkdirSync(dir, { recursive: true });

  const spec = leerSpec(pantalla.slug);
  const referencia = resolverReferencia(pantalla);

  // LA BARRA DE ESTADO. Cada frame mobile arranca con una instancia
  // `Status bar - iPhone` de 402×62: el `9:41` con la señal y la batería. Esa
  // barra la dibuja el sistema operativo, fuera del viewport de la página, así
  // que el sitio NO la dibuja y su contenido empieza 62 px más arriba que el
  // del frame.
  //
  // Se lee del spec y no se escribe 62 a mano: en un frame que no la tenga
  // —el desktop, o un frame mobile nuevo sin la instancia— sale 0 y todo esto
  // se desactiva solo, en vez de correr una pantalla que no había que correr.
  const barra = altoBarraEstado(spec);

  // El viewport sale, en este orden: de lo que diga nodes.json, del frame del
  // spec menos la barra, o del tamaño del PNG de referencia. Comparar un render
  // de 402×874 contra un diseño de 402×969 da un diff enorme que no significa
  // nada — y comparar contra los 969 enteros deja una franja vacía de 62 px
  // abajo que el diff cuenta como distinta.
  const png = referencia ? tamanoPng(referencia) : null;
  const ancho = pantalla.viewport?.[0] ?? spec?.frame.w ?? png?.w ?? 402;
  const alto =
    pantalla.viewport?.[1] ?? (spec ? spec.frame.h - barra : null) ?? png?.h ?? 874;

  const pagina = await navegador.newPage({
    viewport: { width: Math.round(ancho), height: Math.round(alto) },
    deviceScaleFactor: 1,
    // Sin esto se mide a mitad de una animación. El `animation: none` que se
    // inyecta más abajo apaga las de CSS, pero Framer Motion escribe el
    // `transform` inline desde JS y sigue corriendo igual: el cofre de perdiste
    // se medía 199,5×199,5 en vez de 197×197 porque la captura lo agarraba
    // balanceándose. Los componentes respetan `useReducedMotion`, así que con
    // esto quedan quietos en reposo. NO SACAR.
    reducedMotion: 'reduce',
  });

  const errores = [];
  pagina.on('pageerror', (e) => errores.push(String(e)));

  await pagina.goto(`${BASE}/${pantalla.ruta}`, { waitUntil: 'networkidle' });
  await pagina.addStyleTag({
    content: `*,*::before,*::after{animation:none!important;transition:none!important}`,
  });
  await pagina.waitForTimeout(400);

  const captura = path.join(dir, 'render.png');
  await pagina.screenshot({ path: captura });

  // ---------------------------------------------------------- 1. capa a capa
  const medidos = await pagina.$$eval('[data-figma]', (nodos) =>
    nodos.map((n) => {
      const r = n.getBoundingClientRect();
      return {
        // Un elemento puede declarar varios nodos separados por espacio o coma:
        // sirve para un componente compartido por varios frames (las cuatro
        // pantallas de resultado son una sola composición). Gana el primero que
        // exista en el spec de la pantalla que se está midiendo.
        ids: (n.getAttribute('data-figma') ?? '').split(/[\s,]+/).filter(Boolean),
        // data-figma-ejes="x,w" limita la comparación a esos ejes. Es para los
        // contenedores que scrollean, donde el alto real nunca puede coincidir
        // con el del frame y compararlo sería un desvío permanente y falso.
        ejes: (n.getAttribute('data-figma-ejes') ?? '').split(/[\s,]+/).filter(Boolean),
        etiqueta: n.tagName.toLowerCase() + (n.className ? `.${String(n.className).split(' ')[0]}` : ''),
        // ¿El elemento está girado por CSS? Cambia con qué se lo compara: si
        // rota, getBoundingClientRect ya devuelve la caja envolvente y es
        // directamente comparable contra la de Figma. Si no rota, sólo sirve
        // el centro — y ahí el ancho y el alto quedan sin verificar, que es
        // como un asset con el recorte equivocado pasa desapercibido.
        rotadoCss: (() => {
          const t = getComputedStyle(n).transform;
          if (!t || t === 'none') return false;
          const m = t.match(/matrix\(([^)]+)\)/);
          if (!m) return true; // matrix3d u otra cosa: asumimos que sí
          const [a, b] = m[1].split(',').map(Number);
          return Math.abs(Math.atan2(b, a)) > 0.005; // ~0.3°
        })(),
        // data-figma-omitir="pintura" saca a esta capa del control de color y
        // tipografía. Para los casos donde el diseño pinta en un hijo, o donde
        // el elemento del código no es el que lleva el color.
        omitir: (n.getAttribute('data-figma-omitir') ?? '').split(/[\s,]+/).filter(Boolean),
        estilo: (() => {
          const c = getComputedStyle(n);
          const t = c.transform;
          const mt = t && t !== 'none' ? t.match(/matrix\(([^)]+)\)/) : null;
          const [ta, tb, tc, td] = mt ? mt[1].split(',').map(Number) : [1, 0, 0, 1];
          return {
            // Determinante negativo = la capa está espejada por CSS.
            espejoCss: ta * td - tb * tc < 0,
            color: c.color,
            fondo: c.backgroundColor,
            fuente: c.fontFamily,
            cuerpo: parseFloat(c.fontSize),
            interlineado: c.lineHeight,
            espaciado: c.letterSpacing,
            alineacion: c.textAlign,
            transformacion: c.textTransform,
            opacidad: parseFloat(c.opacity),
            radio: c.borderRadius,
            trazoAncho: c.webkitTextStrokeWidth,
            trazoColor: c.webkitTextStrokeColor,
            ordenPintado: c.paintOrder || 'normal',
            bordeAncho: c.borderTopWidth,
            bordeColor: c.borderTopColor,
            sombraTexto: c.textShadow,
            sombraCaja: c.boxShadow,
            filtro: c.filter,
            hijos: n.children.length,
          };
        })(),
        x: Math.round(r.x * 10) / 10,
        y: Math.round(r.y * 10) / 10,
        w: Math.round(r.width * 10) / 10,
        h: Math.round(r.height * 10) / 10,
      };
    }),
  );

  const desvios = [];
  if (spec) {
    const porId = new Map();
    indexar(spec.arbol, porId);
    const escala = ancho / spec.frame.w; // el diseño puede estar a otra escala
    // El cero del eje Y del sitio es el borde INFERIOR de la barra de estado,
    // no el borde del frame. Todo lo esperado se corre esos 62 px de diseño;
    // sin esto, las diez pantallas darían Δy −62 pareja y el reporte diría que
    // está todo mal cuando lo que cambió es dónde está el cero.
    const origenY = barra * escala;

    for (const m of medidos) {
      const id = m.ids.map((i) => i.replace('-', ':')).find((i) => porId.has(i));
      const esperado = id ? porId.get(id) : null;
      if (!esperado) {
        // Sin nodo en este spec. Si el elemento declaraba varios ids es lo
        // esperado —pertenece a otro frame—, así que no cuenta como falla.
        desvios.push({
          ...m,
          id: m.ids.join(' ') || '—',
          estado: m.ids.length > 1 ? 'otro-frame' : 'sin-nodo',
          nombre: '—',
        });
        continue;
      }
      // Una capa rotada no se puede comparar esquina contra esquina: el spec
      // trae la caja que envuelve a la forma girada y el DOM, la imagen sin
      // rotar. Lo que sí coincide es el CENTRO —rotar un rectángulo no lo
      // mueve— y el tamaño real, que viene en `tamano`.
      // Dos formas de resolver una capa rotada, y se comparan distinto:
      //
      //   a) el CSS la gira  → getBoundingClientRect ya da la caja envolvente,
      //      igual que absoluteBoundingBox. Se compara todo, como una capa sin
      //      rotar. Es la forma preferible: deja el ancho y el alto verificados.
      //   b) el asset viene con el giro cocido → sólo el centro es comparable,
      //      y el ancho y el alto quedan CIEGOS. Se marca en el reporte, porque
      //      así es como un asset mal recortado o a otra escala pasa por ✓.
      const rotadoFigma = Boolean(esperado.rotacion);
      const rotado = rotadoFigma && !m.rotadoCss;
      const ciego = rotado;

      // `tamano` viene en el espacio local de la capa. En un giro de 90° o 270°
      // los ejes quedan cambiados respecto de lo que se ve en pantalla: un
      // pergamino de 534×340 girado -90° ocupa 340×534. Sin esto la fila
      // muestra Δw −203 y Δh +194, que no significan nada.
      const giro = Math.abs(esperado.rotacion ?? 0) % 180;
      const ejesDadosVuelta = Math.abs(giro - 90) < 1;
      const tam = !esperado.tamano
        ? null
        : ejesDadosVuelta
          ? { w: esperado.tamano.h, h: esperado.tamano.w }
          : esperado.tamano;

      const e = {
        x: esperado.rect.x * escala,
        y: esperado.rect.y * escala - origenY,
        w: (rotado && tam ? tam.w : esperado.rect.w) * escala,
        h: (rotado && tam ? tam.h : esperado.rect.h) * escala,
      };

      const d = rotado
        ? {
            // centro contra centro
            dx: m.x + m.w / 2 - (e.x + esperado.rect.w * escala / 2),
            dy: m.y + m.h / 2 - (e.y + esperado.rect.h * escala / 2),
            dw: m.w - e.w,
            dh: m.h - e.h,
          }
        : { dx: m.x - e.x, dy: m.y - e.y, dw: m.w - e.w, dh: m.h - e.h };

      // Con data-figma-ejes sólo pesan los ejes declarados; el resto se mide
      // igual y se muestra, pero no decide si la capa pasa o no.
      const clave = { x: 'dx', y: 'dy', w: 'dw', h: 'dh' };
      const porDefecto = rotado
        ? ['dx', 'dy'] // en una rotada el ancho depende del recorte del asset
        : Object.keys(clave).map((k) => clave[k]);
      const cuentan = m.ejes.length ? m.ejes.map((k) => clave[k]).filter(Boolean) : porDefecto;
      const peor = Math.max(...cuentan.map((k) => Math.abs(d[k])));

      // data-figma-omitir acepta "pintura" (todo) o claves sueltas:
      // color, fondo, tipografía, cuerpo, sombras, trazo, borde…
      const pintura = m.omitir.includes('pintura')
        ? []
        : compararPintura(esperado, m.estilo, escala).filter((x) => !m.omitir.includes(x.clave));

      desvios.push({
        ...m,
        pintura,
        id,
        nombre: esperado.nombre,
        esperado: e,
        d,
        ejes: m.ejes,
        rotado: rotadoFigma ? esperado.rotacion : null,
        ciego,
        peor,
        estado: peor <= TOLERANCIA ? 'ok' : 'desviado',
      });
    }
  }

  // ------------------------------------------- 2. al revés: qué falta marcar
  // La pasada de arriba sale del DOM, así que sólo ve lo que ya está escrito y
  // marcado. Lo que el diseño tiene y el código no, no aparece por ninguna
  // parte: la pantalla da ✓ con 0 desvíos porque las capas que faltan no entran
  // en la cuenta. Esta sale del spec y busca lo contrario.
  //
  // Todavía NO decide si la pantalla pasa: no toca `fallas`. Primero hay que
  // mirar la lista de las once pantallas y separar lo que falta dibujar de lo
  // que está dibujado y sólo le falta bajar la marca un nivel.
  const cobertura = spec
    ? { sinMarca: capasSinMarca(spec.arbol, medidos), pintan: contarQuePintan(spec.arbol) }
    : null;
  if (cobertura) {
    pintanTotal += cobertura.pintan;
    sinMarcaTotal += cobertura.sinMarca.length;
  }

  // -------------------------------------------------------- 3. píxel a píxel
  let pixeles = null;
  if (referencia) {
    // El recorte va en px del RENDER, que es la escala en la que se compara.
    pixeles = await compararImagenes(
      navegador, captura, referencia, dir, UMBRAL_PIXEL, barra * (ancho / (spec?.frame.w ?? ancho)),
    );
  }

  await pagina.close();

  // ------------------------------------------------------------- el reporte
  const desviados = desvios.filter((d) => d.estado === 'desviado');
  const huerfanos = desvios.filter((d) => d.estado === 'sin-nodo');
  const pinturaMal = desvios.flatMap((d) =>
    (d.pintura ?? []).filter((x) => !x.ok).map((x) => ({ ...x, capa: d.nombre, id: d.id })),
  );
  if (desviados.length || pinturaMal.length || errores.length) fallas++;

  fs.writeFileSync(
    path.join(dir, 'reporte.md'),
    reporte(pantalla, spec, { ancho, alto }, desvios, pixeles, errores, referencia, medidos.length, cobertura),
  );

  // Sin spec no hubo comparación: no se pinta ✓, porque "0 desvíos sobre 0
  // comparaciones" no es lo mismo que "coincide con el diseño".
  const marca = !spec ? '?' : desviados.length ? '✗' : '✓';
  const resumenPx = pixeles ? `  ${pixeles.pct}% de píxeles distintos` : '';

  if (!spec) {
    sinSpec++;
    console.log(
      `  ${marca} ${pantalla.slug}  ${ancho}×${alto}  ${medidos.length} capas marcadas, ` +
        `sin comparar (falta figma/spec/${pantalla.slug}.json)${resumenPx}`,
    );
    console.log(`      corré  npm run figma:pull ${pantalla.slug}  para poder medir`);
  } else {
    console.log(
      `  ${marca} ${pantalla.slug}  ${ancho}×${alto}  ${medidos.length} capas medidas, ` +
        `${desviados.length} fuera de ${TOLERANCIA}px${huerfanos.length ? `, ${huerfanos.length} sin nodo` : ''}${resumenPx}`,
    );
    if (cobertura) {
      console.log(
        `      cobertura: ${cobertura.pintan - cobertura.sinMarca.length}/${cobertura.pintan} ` +
          'capas del diseño que pintan tienen data-figma',
      );
    }
    const ciegas = desvios.filter((x) => x.ciego);
    if (ciegas.length) {
      console.log(
        `      ⚠ ${ciegas.length} capa(s) rotada(s) sin girar por CSS: se verificó el centro, NO el tamaño` +
          ` (${ciegas.map((x) => x.nombre).join(', ')})`,
      );
    }
    for (const d of desviados.slice(0, 8)) {
      console.log(
        `      ${d.nombre} (${d.id}): ` +
          `${signo(d.d.dx)}x ${signo(d.d.dy)}y ${signo(d.d.dw)}w ${signo(d.d.dh)}h`,
      );
    }
    if (pinturaMal.length) {
      console.log(`      ${pinturaMal.length} desvío(s) de pintura:`);
      for (const x of pinturaMal.slice(0, 8)) {
        console.log(`        ${x.capa} · ${x.prop}: esperaba ${x.esperado}, hay ${x.real}`);
      }
      if (pinturaMal.length > 8) console.log(`        … y ${pinturaMal.length - 8} más, en el reporte`);
    }
    if (cobertura?.sinMarca.length) {
      const sueltas = cobertura.sinMarca.filter((x) => !x.ancestro);
      console.log(
        `      ⚠ ${cobertura.sinMarca.length} capa(s) del diseño sin implementar o sin marcar` +
          ` (${sueltas.length} sin ningún ancestro marcado):`,
      );
      for (const x of cobertura.sinMarca.slice(0, 15)) console.log(`        ${lineaSinMarca(x)}`);
      if (cobertura.sinMarca.length > 15) {
        console.log(`        … y ${cobertura.sinMarca.length - 15} más, en el reporte`);
      }
    }
  }

  if (!medidos.length) {
    console.log('      (ninguna capa marcada con data-figma — ver docs/FIGMA-WORKFLOW.md)');
  }
}

await navegador.close();
const cierre = fallas
  ? `${fallas} pantalla(s) con desvíos.`
  : sinSpec
    ? `Ninguna pantalla se pudo comparar: falta el spec de ${sinSpec}. Corré figma:pull.`
    : 'Todo dentro de tolerancia.';
console.log(`\n  Salida en figma/check/. ${cierre}`);
if (pintanTotal) {
  const pct = Math.round((100 * sinMarcaTotal) / pintanTotal);
  console.log(
    `  Cobertura del diseño: ${pintanTotal - sinMarcaTotal}/${pintanTotal} capas que pintan tienen ` +
      `data-figma. Faltan ${sinMarcaTotal} (${pct}%), que nadie compara con nada.`,
  );
}
// Las capas sin marcar todavía NO rompen nada: el exit code sigue saliendo sólo
// de los desvíos, de la pintura y de los errores de JS. Cuando la lista de las
// once pantallas esté depurada, sumar `sinMarcaTotal` a esta condición.
process.exit(fallas ? 1 : 0);

// ---------------------------------------------------------------- funciones

/**
 * Diff de dos PNG usando canvas dentro del navegador: escala la referencia al
 * ancho del render, cuenta píxeles que difieren más que el umbral y escribe
 * el mapa de diferencias y el overlay.
 */
async function compararImagenes(navegador, capturaPath, referenciaPath, dir, umbral, recorte = 0) {
  const pagina = await navegador.newPage();
  const aData = (p) => `data:image/png;base64,${fs.readFileSync(p).toString('base64')}`;

  const salida = await pagina.evaluate(
    async ([srcA, srcB, umbral, recorte]) => {
      const cargar = (src) =>
        new Promise((res, rej) => {
          const i = new Image();
          i.onload = () => res(i);
          i.onerror = rej;
          i.src = src;
        });

      const [render, diseno] = await Promise.all([cargar(srcA), cargar(srcB)]);
      const w = render.width;
      const h = render.height;

      const lienzo = (dibujar) => {
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        const ctx = c.getContext('2d', { willReadFrequently: true });
        dibujar(ctx);
        return { c, ctx };
      };

      // La referencia se escala al ancho del render manteniendo proporción, y
      // se le saca de arriba la banda de la barra de estado: el render arranca
      // en el borde INFERIOR de esa barra y la referencia la trae dibujada.
      const escala = w / diseno.width;
      const recorteSrc = Math.round(recorte / escala);
      const altoSrc = diseno.height - recorteSrc;
      const hDiseno = altoSrc * escala;
      const pintarDiseno = (ctx) =>
        ctx.drawImage(diseno, 0, recorteSrc, diseno.width, altoSrc, 0, 0, w, hDiseno);

      const a = lienzo((ctx) => ctx.drawImage(render, 0, 0));
      const b = lienzo(pintarDiseno);

      const da = a.ctx.getImageData(0, 0, w, h).data;
      const db = b.ctx.getImageData(0, 0, w, h).data;

      const diff = lienzo((ctx) => {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, w, h);
      });
      const dd = diff.ctx.getImageData(0, 0, w, h);
      let distintos = 0;

      for (let i = 0; i < da.length; i += 4) {
        const delta = Math.max(
          Math.abs(da[i] - db[i]),
          Math.abs(da[i + 1] - db[i + 1]),
          Math.abs(da[i + 2] - db[i + 2]),
        );
        if (delta > umbral) {
          distintos++;
          dd.data[i] = 255;
          dd.data[i + 1] = 0;
          dd.data[i + 2] = 80;
          dd.data[i + 3] = 255;
        } else {
          const gris = (da[i] + da[i + 1] + da[i + 2]) / 3;
          dd.data[i] = dd.data[i + 1] = dd.data[i + 2] = gris * 0.25 + 190 * 0.75;
          dd.data[i + 3] = 255;
        }
      }
      diff.ctx.putImageData(dd, 0, 0);

      // Overlay: el diseño encima del render, medio transparente.
      const over = lienzo((ctx) => {
        ctx.drawImage(render, 0, 0);
        ctx.globalAlpha = 0.5;
        pintarDiseno(ctx);
      });

      return {
        distintos,
        total: w * h,
        w,
        h,
        hDiseno: Math.round(hDiseno),
        recorteSrc,
        diff: diff.c.toDataURL('image/png'),
        overlay: over.c.toDataURL('image/png'),
      };
    },
    [aData(capturaPath), aData(referenciaPath), umbral, recorte],
  );

  await pagina.close();

  const guardar = (dataUrl, nombre) =>
    fs.writeFileSync(path.join(dir, nombre), Buffer.from(dataUrl.split(',')[1], 'base64'));
  guardar(salida.diff, 'diff.png');
  guardar(salida.overlay, 'overlay.png');

  return {
    pct: Number(((100 * salida.distintos) / salida.total).toFixed(2)),
    distintos: salida.distintos,
    total: salida.total,
    altoDiseno: salida.hDiseno,
    altoRender: salida.h,
    recorte: salida.recorteSrc,
  };
}

/* ------------------------------------------------------- el reporte inverso

   El control capa a capa recorre el DOM: mide lo que está marcado y lo compara
   contra el spec. Por construcción no puede ver lo que NO está — una capa del
   diseño que nadie escribió no aparece en el DOM, así que tampoco aparece en el
   reporte, y la pantalla da ✓ con 0 desvíos igual. Las dos cintas del titular de
   REGISTRO vivieron ahí: el diseño tiene dos vectores, el código las fusionaba en
   una silueta recortada con clip-path, y nunca hubo un número que dijera que
   faltaban.

   Estas funciones cierran el agujero recorriendo el spec al revés. */

/** ¿La capa dibuja tinta propia? Relleno o trazo, con algo de opacidad. */
function pintaAlgo(n) {
  if (n.oculto || n.opacidad === 0) return false;
  // Alfa 00 —el `#FFFFFF00` con que Figma rellena los contenedores de instancia—
  // no pinta nada, y marcarlo no verificaría ningún color.
  const visible = (p) => p && (p.tipo !== 'solido' || !/^#[0-9a-fA-F]{6}00$/.test(p.color ?? ''));
  return (n.relleno ?? []).some(visible) || (n.trazo ?? []).some(visible);
}

/**
 * Alto de la instancia `Status bar - iPhone` del frame, en px de diseño.
 *
 * Devuelve 0 si el frame no la tiene. Se busca por nombre y no por id porque
 * cada frame trae su propia instancia con un id distinto, y por tipo INSTANCE
 * anclada arriba a la izquierda para no confundirla con nada.
 */
function altoBarraEstado(spec) {
  if (!spec) return 0;
  let alto = 0;
  (function buscar(n) {
    if (/^status bar/i.test(n.nombre ?? '') && n.rect && n.rect.y === 0) {
      alto = Math.max(alto, n.rect.h);
      return; // no hace falta entrar: sus hijos son el reloj y la batería
    }
    for (const h of n.hijos ?? []) buscar(h);
  })(spec.arbol);
  return alto;
}

/** Cuántas capas del spec pintan algo: el denominador de la cobertura. */
function contarQuePintan(nodo) {
  return (pintaAlgo(nodo) ? 1 : 0) + (nodo.hijos ?? []).reduce((a, h) => a + contarQuePintan(h), 0);
}

/**
 * Capas del diseño que pintan algo y no tienen `data-figma` en el DOM: «sin
 * implementar o sin marcar».
 *
 * Un GROUP o un FRAME sin relleno queda fuera: no dibuja nada por sí mismo —lo
 * dibujan sus hijos— así que marcarlo no verificaría nada.
 *
 * `ancestro` es la capa marcada más cercana hacia arriba, si hay alguna, y es lo
 * que separa los dos casos que la lista mezclaría:
 *
 *   · sin ancestro marcado → la capa no está en el código. Hay que dibujarla, y
 *     hasta entonces nada la compara con nada.
 *   · con ancestro marcado → está dibujada, pero la marca vive más arriba: el
 *     vector y el rótulo de un botón, cubiertos por la marca del grupo. Bajar la
 *     marca un nivel es opcional. Sin esta distinción son mayoría en la lista y
 *     tapan a las que de verdad faltan.
 */
function capasSinMarca(arbol, medidos) {
  // Todos los ids declarados en el DOM, no sólo el que resolvió la comparación:
  // un elemento compartido por varios frames declara varios, y ninguno de ellos
  // está «sin marcar».
  const marcados = new Set();
  for (const m of medidos) for (const i of m.ids) marcados.add(i.replace('-', ':'));

  const out = [];
  recorrer(arbol, 0, null);
  return out;

  function recorrer(n, nivel, ancestro) {
    const marcado = marcados.has(n.id);
    if (!marcado && pintaAlgo(n)) out.push({ ...n, nivel, ancestro });
    // El frame raíz no cuenta como ancestro que cubra: TODAS las capas
    // descienden de él y está marcado en las once pantallas, así que si contara,
    // «tiene un ancestro marcado» sería siempre verdadero y no distinguiría
    // nada. De ahí el `nivel > 0`.
    const heredado = marcado && nivel > 0 ? { id: n.id, nombre: n.nombre } : ancestro;
    for (const h of n.hijos ?? []) recorrer(h, nivel + 1, heredado);
  }
}

/** Una capa sin marcar, en una línea, para la consola. */
function lineaSinMarca(x) {
  const caja = x.rect ? ` [${x.rect.x}, ${x.rect.y}, ${x.rect.w}, ${x.rect.h}]` : '';
  const dentro = x.ancestro ? `  · dentro de ${x.ancestro.nombre} (${x.ancestro.id}), ya marcado` : '';
  return `${x.nombre} (${x.id}) ${x.tipo}${caja}${dentro}`;
}

function resolverReferencia(pantalla) {
  const candidatos = [
    pantalla.referencia && path.join(RAIZ, pantalla.referencia),
    path.join(SPEC, `${pantalla.slug}.png`),
  ].filter(Boolean);
  return candidatos.find((c) => fs.existsSync(c)) ?? null;
}

/** Ancho y alto de un PNG leyendo el IHDR. Trece bytes, cero dependencias. */
function tamanoPng(ruta) {
  const fd = fs.openSync(ruta, 'r');
  const buf = Buffer.alloc(24);
  fs.readSync(fd, buf, 0, 24, 0);
  fs.closeSync(fd);
  if (buf.toString('ascii', 12, 16) !== 'IHDR') return null;
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

function reporte(pantalla, spec, viewport, desvios, pixeles, errores, referencia, marcadas, cobertura) {
  const l = [];
  l.push(`# ${pantalla.slug}`);
  l.push('');
  l.push(`Ruta \`${pantalla.ruta}\` · viewport **${viewport.ancho}×${viewport.alto}**`);
  if (spec) l.push(`Frame Figma \`${spec.node}\` (${spec.frame.w}×${spec.frame.h})`);
  if (referencia) l.push(`Referencia: \`${path.relative(RAIZ, referencia)}\``);
  l.push('');

  if (pixeles) {
    l.push('## Píxeles');
    l.push('');
    l.push(`**${pixeles.pct}%** de los píxeles difieren (${pixeles.distintos.toLocaleString('es')} de ${pixeles.total.toLocaleString('es')}).`);
    l.push('');
    if (pixeles.recorte) {
      l.push(`A la referencia se le recortaron **${pixeles.recorte} px** de arriba: la barra de`);
      l.push('estado que el diseñador dibujó en el frame y que el sitio no dibuja, porque');
      l.push('la dibuja el sistema. Sin ese recorte el overlay queda corrido de punta a');
      l.push('punta y el porcentaje no quiere decir nada.');
      l.push('');
    }
    l.push('- `render.png` — lo que dibuja el sitio');
    l.push('- `diff.png` — en rojo lo que no coincide');
    l.push('- `overlay.png` — el diseño al 50% encima del render');
    l.push('');
    l.push('Un porcentaje alto no siempre es un error: una animación detenida en');
    l.push('otro fotograma, o un degradado, mueven la aguja. Mirá el overlay antes');
    l.push('de perseguir el número.');
    l.push('');
  }

  l.push('## Capas');
  l.push('');
  if (!spec) {
    l.push(`**${marcadas} capas marcadas, ninguna comparada.** Falta el spec del`);
    l.push('diseño, así que el script pudo medir el render pero no tiene contra qué.');
    l.push('');
    l.push(`    npm run figma:pull ${pantalla.slug}`);
    l.push('');
    l.push('Hasta entonces lo único válido de este reporte es la parte de píxeles,');
    l.push('y sólo para mirar el overlay: no hay ningún número que diga si la');
    l.push('pantalla coincide con el diseño.');
  } else if (!desvios.length) {
    l.push('Ninguna capa marcada con `data-figma`. Sin eso sólo hay comparación');
    l.push('por píxel, que dice *que* algo está mal pero no *qué*.');
    l.push('Ver `docs/FIGMA-WORKFLOW.md`.');
  } else {
    l.push('| Capa | Nodo | Estado | Δx | Δy | Δw | Δh |');
    l.push('| --- | --- | --- | ---: | ---: | ---: | ---: |');
    for (const d of desvios) {
      if (d.estado === 'sin-nodo') {
        l.push(`| \`${d.etiqueta}\` | ${d.id} | ⚠ no está en el spec | | | | |`);
        continue;
      }
      if (d.estado === 'otro-frame') {
        l.push(`| \`${d.etiqueta}\` | ${d.id} | · pertenece a otro frame | | | | |`);
        continue;
      }
      const marca = d.estado === 'ok' ? '✓' : '✗';
      const ejes = d.ejes?.length
        ? ` (sólo ${d.ejes.join('/')})`
        : d.ciego
          ? ` (rotada ${d.rotado}°, sólo centro — w/h SIN VERIFICAR)`
          : d.rotado
            ? ` (rotada ${d.rotado}° por CSS)`
            : '';
      l.push(
        `| ${d.nombre}${ejes} | \`${d.id}\` | ${marca} | ${signo(d.d.dx)} | ${signo(d.d.dy)} | ${signo(d.d.dw)} | ${signo(d.d.dh)} |`,
      );
    }
    l.push('');
    l.push(`Tolerancia: ${TOLERANCIA} px. Δ positivo = el render está más a la derecha / abajo / grande que el diseño.`);
    l.push('');
    const ciegas = desvios.filter((x) => x.ciego);
    if (ciegas.length) {
      l.push('');
      l.push(`⚠ **${ciegas.length} capa(s) rotada(s) con el giro cocido en el asset.** De esas`);
      l.push('sólo se verificó el centro: el ancho y el alto que muestra la tabla no');
      l.push('deciden, así que un asset con otro recorte o a otra escala pasa igual.');
      l.push('Para verificarlas de verdad, que el CSS aplique el giro con `transform:');
      l.push('rotate()` sobre el asset sin rotar — ahí la caja pasa a ser comparable');
      l.push('y el ancho y el alto vuelven a contar.');
      l.push('');
    }
    l.push('Una capa con «sólo x/w» declara `data-figma-ejes`: los demás ejes se');
    l.push('miden y se muestran, pero no deciden si pasa. «Pertenece a otro frame»');
    l.push('es un elemento compartido cuyo nodo vive en otra pantalla: no es falla.');
  }
  l.push('');

  if (cobertura) {
    const { sinMarca, pintan } = cobertura;
    const sueltas = sinMarca.filter((x) => !x.ancestro);
    l.push('## Capas del diseño sin implementar o sin marcar');
    l.push('');
    l.push(`**${pintan - sinMarca.length} de ${pintan}** capas que pintan algo tienen \`data-figma\`.`);
    l.push('');
    l.push('La tabla de arriba recorre el DOM, así que sólo puede hablar de lo que ya');
    l.push('está marcado: una capa del diseño que nadie escribió no está en el DOM y');
    l.push('por lo tanto no aparece en ninguna de sus filas. Esta sección recorre el');
    l.push('spec al revés y lista lo que el diseño tiene y el código no compara.');
    l.push('');
    if (!sinMarca.length) {
      l.push('Ninguna: todas las capas que pintan tienen su marca.');
      l.push('');
    } else {
      l.push(`**${sinMarca.length} sin marcar**, y de esas **${sueltas.length} sin ningún ancestro marcado**.`);
      l.push('');
      l.push('| Capa | Nodo | Tipo | x | y | w | h | Dentro de |');
      l.push('| --- | --- | --- | ---: | ---: | ---: | ---: | --- |');
      for (const x of sinMarca) {
        const r = x.rect ?? {};
        const dentro = x.ancestro ? `\`${x.ancestro.id}\` ${x.ancestro.nombre}` : '**—**';
        l.push(
          `| ${'·'.repeat(x.nivel)}${escapar(x.nombre)} | \`${x.id}\` | ${x.tipo} | ` +
            `${r.x ?? ''} | ${r.y ?? ''} | ${r.w ?? ''} | ${r.h ?? ''} | ${dentro} |`,
        );
      }
      l.push('');
      l.push('«Pinta algo» = tiene relleno o trazo visible. Un grupo o un frame sin');
      l.push('relleno no dibuja nada por sí mismo —lo dibujan sus hijos— así que no');
      l.push('entra en la cuenta: marcarlo no verificaría nada.');
      l.push('');
      l.push('La columna «Dentro de» es la que hace accionable la lista. Con `—`, la');
      l.push('capa no está en el código: hay que dibujarla, y hasta entonces no hay');
      l.push('ningún número que diga que falta. Con un nodo, está dibujada y la marca');
      l.push('vive más arriba —el vector y el rótulo de un botón, cubiertos por la');
      l.push('marca del grupo—: ahí bajar la marca un nivel es opcional, y sólo suma');
      l.push('si esa capa se puede mover por su cuenta.');
      l.push('');
      l.push('Esta sección todavía no decide el exit code.');
      l.push('');
      l.push('**Y no lo lista todo.** Este control mide una sola foto: el estado inicial');
      l.push('de la ruta. Lo que sólo existe después de una interacción no aparece acá ni');
      l.push('en la tabla de arriba, aunque esté escrito y marcado — las miniaturas a la');
      l.push('izquierda del carrusel de PREMIOS estan declaradas en `Prizes.tsx` y aun asi');
      l.push('figuran como sin implementar, porque en la posicion 0 no llegan al DOM.');
      l.push('Problema abierto, con los tres casos confirmados, en `docs/FIGMA-WORKFLOW.md`.');
      l.push('');
    }
  }

  const pintura = desvios.flatMap((d) =>
    (d.pintura ?? []).map((x) => ({ ...x, capa: d.nombre, id: d.id })),
  );
  if (pintura.length) {
    const mal = pintura.filter((x) => !x.ok);
    l.push('## Pintura');
    l.push('');
    l.push(`${pintura.length} propiedades comprobadas, **${mal.length} fuera**.`);
    l.push('');
    l.push('Color, tipografía, cuerpo, interlineado, espaciado, transformación,');
    l.push('opacidad, radios y sombras. Nada de esto mueve la caja, así que la tabla');
    l.push('de capas puede dar todo en cero y la pantalla verse distinta igual.');
    l.push('');
    const ajustes = pintura.filter((x) => x.ajuste);
    if (ajustes.length) {
      l.push(`Además, **${ajustes.length} cuerpo(s) ajustados** por la tipografía sustituta:`);
      l.push('');
      l.push('| Capa | Nodo | Diseño | Sitio |');
      l.push('| --- | --- | --- | --- |');
      for (const x of ajustes) {
        l.push(`| ${x.capa} | \`${x.id}\` | ${escapar(x.esperado)} | ${escapar(x.real)} |`);
      }
      l.push('');
      l.push('No cuentan como desvío: la sustituta es más ancha y a igual cuerpo el');
      l.push('texto se parte y corre la pantalla. Se iguala la caja del nodo, no su');
      l.push('número de px. Se toleran hasta un 20% y sólo hacia abajo.');
      l.push('');
    }
    if (mal.length) {
      l.push('| Capa | Nodo | Propiedad | Diseño | Sitio |');
      l.push('| --- | --- | --- | --- | --- |');
      for (const x of mal) {
        l.push(`| ${x.capa} | \`${x.id}\` | ${x.prop} | ${escapar(x.esperado)} | ${escapar(x.real)} |`);
      }
    } else {
      l.push('Todo coincide.');
    }
    l.push('');
    l.push('Una capa con `data-figma-omitir="pintura"` queda fuera de este control:');
    l.push('es para cuando el color lo pinta un hijo y no el elemento marcado.');
    l.push('');
  }

  if (errores.length) {
    l.push('## Errores de JavaScript');
    l.push('');
    for (const e of errores) l.push(`- \`${e}\``);
    l.push('');
  }

  return l.join('\n') + '\n';
}

// ---------------------------------------------------------------- la pintura

/**
 * Compara lo que NO es geometría: color, tipografía, cuerpo, interlineado,
 * espaciado, transformación, opacidad, radios y sombras.
 *
 * Existe porque la tabla de cajas da todo en cero y la pantalla igual se ve
 * distinta: un título con el resplandor del color equivocado, una etiqueta en
 * otro tono, o —el más silencioso de todos— un texto que cayó en la tipografía
 * sustituta porque la licenciada no cargó.
 */
function compararPintura(esperado, e, escala) {
  const out = [];
  const anotar = (prop, esp, real, ok, clave) => out.push({ prop, esperado: esp, real, ok, clave: clave ?? prop });
  const esTexto = esperado.tipo === 'TEXT';
  const tg = esperado.tipografia;

  if (esTexto && esperado.relleno?.[0]?.color) {
    anotar('color', esperado.relleno[0].color, e.color, mismoColor(esperado.relleno[0].color, e.color));
  }
  if (!esTexto && esperado.relleno?.[0]?.tipo === 'solido') {
    anotar('fondo', esperado.relleno[0].color, e.fondo, mismoColor(esperado.relleno[0].color, e.fondo));
  }

  if (tg) {
    if (tg.familia) {
      const real = String(e.fuente ?? '').toLowerCase().replace(/["']/g, '');
      const sustituta = SUSTITUCIONES[tg.familia];
      const ok =
        real.includes(tg.familia.toLowerCase()) ||
        Boolean(sustituta && real.includes(String(sustituta).toLowerCase()));
      anotar(
        'tipografía',
        sustituta ? `${tg.familia} → ${sustituta}` : tg.familia,
        e.fuente,
        ok,
        'tipografia',
      );
    }
    if (tg.tamano) {
      const esp = tg.tamano * escala;
      const exacto = Math.abs(e.cuerpo - esp) <= 0.5;

      // Con una tipografía sustituida el cuerpo casi nunca puede ser el del
      // diseño: la sustituta es más ancha y a igual cuerpo el texto se parte y
      // corre la pantalla entera. El criterio del proyecto es igualar la CAJA
      // del nodo, no su número de px, así que se achica el cuerpo. Eso se
      // tolera —hasta un 20% y sólo hacia abajo— y se muestra igual, marcado
      // como ajuste. Más allá de ese margen vuelve a ser un error: una
      // sustitución no es un permiso para cualquier tamaño.
      const haySustituta = Boolean(tg.familia && SUSTITUCIONES[tg.familia]);
      const ajustado = haySustituta && !exacto && e.cuerpo < esp && e.cuerpo >= esp * 0.8;

      anotar(
        'cuerpo',
        `${red(esp)}px`,
        ajustado ? `${red(e.cuerpo)}px (ajustado por la sustituta)` : `${red(e.cuerpo)}px`,
        exacto || ajustado,
        'cuerpo',
      );
      if (ajustado) out[out.length - 1].ajuste = true;
    }
    if (tg.interlineado) {
      const esp = tg.interlineado * escala;
      const real = parseFloat(e.interlineado);
      anotar('interlineado', `${red(esp)}px`, e.interlineado, Number.isFinite(real) && Math.abs(real - esp) <= 1);
    }
    if (typeof tg.espaciado === 'number' && tg.espaciado !== 0) {
      const esp = tg.espaciado * escala;
      const real = e.espaciado === 'normal' ? 0 : parseFloat(e.espaciado);
      anotar('espaciado', `${red(esp)}px`, e.espaciado, Math.abs(real - esp) <= 0.3);
    }
    const casos = { UPPER: 'uppercase', LOWER: 'lowercase', TITLE: 'capitalize', ORIGINAL: 'none' };
    if (tg.transformacion && casos[tg.transformacion]) {
      anotar('transformación', casos[tg.transformacion], e.transformacion, e.transformacion === casos[tg.transformacion]);
    }
    const alineaciones = { LEFT: 'left', CENTER: 'center', RIGHT: 'right', JUSTIFIED: 'justify' };
    if (tg.alineacion && alineaciones[tg.alineacion]) {
      anotar('alineación', alineaciones[tg.alineacion], e.alineacion, e.alineacion === alineaciones[tg.alineacion]);
    }
  }

  if (esperado.opacidad != null) {
    anotar('opacidad', esperado.opacidad, e.opacidad, Math.abs(e.opacidad - esperado.opacidad) <= 0.02);
  }
  if (esperado.radio != null && !Array.isArray(esperado.radio)) {
    const esp = esperado.radio * escala;
    const real = parseFloat(e.radio);
    anotar('radio', `${red(esp)}px`, e.radio, Number.isFinite(real) && Math.abs(real - esp) <= 1);
  }

  // El trazo. Y con él, el orden de pintado, que es la trampa: CSS por defecto
  // dibuja el relleno y ENCIMA el trazo, así que un trazo centrado de 2px se
  // come 1px de letra por todo el contorno y el texto queda pálido y hueco.
  // Figma lo muestra al revés. `paint-order: stroke fill` lo corrige.
  // El espejo no mueve la caja: sin este control, una pieza dada vuelta pasa
  // con las cuatro medidas en cero. Si el espejo vive en un hijo —porque el
  // elemento marcado lleva una animación que le pisaría el transform— se saca
  // con data-figma-omitir="espejo", anotando por qué.
  if (esperado.espejo || e.espejoCss) {
    anotar(
      'espejo',
      esperado.espejo ? 'espejado' : 'sin espejo',
      e.espejoCss ? 'espejado' : 'sin espejo',
      Boolean(esperado.espejo) === Boolean(e.espejoCss),
      'espejo',
    );
  }

  const trazo = esperado.trazo?.[0];
  if (trazo) {
    const espAncho = (esperado.trazoAncho ?? 0) * escala;
    if (esTexto) {
      const real = parseFloat(e.trazoAncho);
      anotar('trazo (ancho)', `${red(espAncho)}px`, e.trazoAncho, Number.isFinite(real) && Math.abs(real - espAncho) <= 0.3, 'trazo');
      anotar('trazo (color)', trazo.color, e.trazoColor, mismoColor(trazo.color, e.trazoColor), 'trazo');
      anotar(
        'trazo (orden)',
        'stroke fill',
        e.ordenPintado,
        Number.isFinite(real) && real > 0 ? String(e.ordenPintado).trim().startsWith('stroke') : true,
        'trazo',
      );
    } else {
      const real = parseFloat(e.bordeAncho);
      anotar(
        'borde',
        `${red(espAncho)}px ${trazo.color ?? ''}`.trim(),
        `${e.bordeAncho} ${e.bordeColor}`,
        Number.isFinite(real) && real > 0 && Math.abs(real - espAncho) <= 0.5 && mismoColor(trazo.color, e.bordeColor),
        'borde',
      );
    }
  }

  // Las sombras se buscan en text-shadow, box-shadow y filter a la vez: para un
  // texto van en la primera, para una imagen con alfa en drop-shadow().
  const sombras = (esperado.efectos ?? []).filter((x) => x.tipo === 'DROP_SHADOW');
  if (sombras.length) {
    const real = [e.sombraTexto, e.sombraCaja, e.filtro].filter((v) => v && v !== 'none').join(' ');
    const radios = [...real.matchAll(/([\d.]+)px/g)].map((x) => Number(x[1]));
    const sinRadio = sombras.filter(
      (x) => !radios.some((r) => Math.abs(r - x.blur * escala) <= Math.max(2, x.blur * escala * 0.15)),
    );
    const sinColor = sombras.filter((x) => x.color && !contieneColor(real, x.color));
    anotar(
      'sombras',
      sombras.map((x) => x.css).join(' + '),
      real || 'ninguna',
      Boolean(real) && !sinRadio.length && !sinColor.length,
      'sombras',
    );
  }

  return out;
}

function aRgb(v) {
  if (v == null) return null;
  const s = String(v).trim();
  const hex = s.match(/^#([0-9a-f]{6})([0-9a-f]{2})?$/i);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: hex[2] ? parseInt(hex[2], 16) / 255 : 1 };
  }
  const m = s.match(/rgba?\(([^)]+)\)/i);
  if (m) {
    const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  }
  const nombres = { white: '#FFFFFF', black: '#000000', transparent: '#00000000' };
  return nombres[s.toLowerCase()] ? aRgb(nombres[s.toLowerCase()]) : null;
}

function mismoColor(a, b) {
  const x = aRgb(a);
  const y = aRgb(b);
  if (!x || !y) return false;
  if (x.a === 0 && y.a === 0) return true;
  return (
    Math.abs(x.r - y.r) <= 2 &&
    Math.abs(x.g - y.g) <= 2 &&
    Math.abs(x.b - y.b) <= 2 &&
    Math.abs(x.a - y.a) <= 0.03
  );
}

function contieneColor(texto, hex) {
  const t = String(texto);
  for (const m of t.matchAll(/rgba?\([^)]+\)/gi)) if (mismoColor(hex, m[0])) return true;
  for (const m of t.matchAll(/#[0-9a-f]{6,8}\b/gi)) if (mismoColor(hex, m[0])) return true;
  for (const n of ['white', 'black']) if (new RegExp(`\\b${n}\\b`, 'i').test(t) && mismoColor(hex, n)) return true;
  return false;
}

function escapar(v) {
  return String(v ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

function red(v) {
  return typeof v === 'number' ? Number(v.toFixed(1)) : v;
}

function indexar(nodo, mapa) {
  mapa.set(nodo.id, nodo);
  for (const h of nodo.hijos ?? []) indexar(h, mapa);
}

function leerSpec(slug) {
  const p = path.join(SPEC, `${slug}.json`);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null;
}

// function y no const: el cuerpo del script corre antes de llegar acá.
function signo(v) {
  return v > 0 ? `+${v.toFixed(1)}` : v.toFixed(1);
}

function salir(msg) {
  console.error(`\n${msg}\n`);
  process.exit(1);
}

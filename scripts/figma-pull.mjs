/**
 * Baja el diseño exacto de Figma y lo deja como spec legible en `figma/spec/`.
 *
 *   FIGMA_TOKEN=figd_xxx node scripts/figma-pull.mjs registro-mobile
 *   FIGMA_TOKEN=figd_xxx node scripts/figma-pull.mjs --all
 *
 * El mapa de qué frame es cada pantalla vive en `figma/nodes.json`.
 *
 * Por cada frame escribe tres archivos:
 *
 *   figma/spec/<slug>.json   el árbol completo, normalizado y con las
 *                            coordenadas relativas al frame (no absolutas)
 *   figma/spec/<slug>.md     el mismo árbol en tabla, para leer y para que lo
 *                            lea un agente antes de escribir el CSS
 *   figma/spec/<slug>.png    el render de referencia (sólo con --png)
 *
 * Por qué existe: un PNG obliga a adivinar si un margen es 24 o 28. Esto trae
 * el número. Es la misma data que devuelve el MCP de Figma, por la API REST,
 * que tiene su propia cuota.
 *
 * El token sale de figma.com → foto de perfil → Configuración → Seguridad →
 * "Tokens de acceso personal" → generar, con permiso de lectura de archivos.
 * Guardalo en `.env` como FIGMA_TOKEN=... (`.env` está en .gitignore).
 *
 * No requiere dependencias: sólo Node 18+ (fetch nativo).
 */

import fs from 'node:fs';
import path from 'node:path';

const API = 'https://api.figma.com/v1';
const RAIZ = path.resolve(import.meta.dirname, '..');
const MAPA = path.join(RAIZ, 'figma', 'nodes.json');
const SALIDA = path.join(RAIZ, 'figma', 'spec');

// ---------------------------------------------------------------- argumentos

const args = process.argv.slice(2);
const conPng = args.includes('--png');
const todos = args.includes('--all');
const pedidos = args.filter((a) => !a.startsWith('--'));

const token = process.env.FIGMA_TOKEN ?? leerEnv('FIGMA_TOKEN');
if (!token) {
  salir(
    'Falta FIGMA_TOKEN.\n\n' +
      '  1. figma.com → perfil → Configuración → Seguridad → Tokens de acceso personal\n' +
      '  2. Generar uno con lectura de archivos\n' +
      '  3. Guardalo en .env:  FIGMA_TOKEN=figd_...\n',
  );
}

if (!fs.existsSync(MAPA)) salir(`No existe ${rel(MAPA)}. Copiá figma/nodes.example.json y completá los node id.`);
const mapa = JSON.parse(fs.readFileSync(MAPA, 'utf8'));
const fileKey = mapa.fileKey;
if (!fileKey) salir(`${rel(MAPA)} no tiene "fileKey".`);

const pantallas = Object.entries(mapa.pantallas ?? {})
  .map(([slug, valor]) => ({ slug, ...(typeof valor === 'string' ? { node: valor } : valor) }))
  .filter((p) => p.node && !p.node.startsWith('TODO'));

if (!pantallas.length) salir(`${rel(MAPA)} no tiene ningún node id cargado todavía.`);

const objetivo = todos ? pantallas : pantallas.filter((p) => pedidos.includes(p.slug));
if (!objetivo.length) {
  salir(
    `Pasá el slug de una pantalla o --all.\n\nDisponibles: ${pantallas.map((p) => p.slug).join(', ')}`,
  );
}

// ------------------------------------------------------------------- proceso

fs.mkdirSync(SALIDA, { recursive: true });

const ids = objetivo.map((p) => normalizarId(p.node));
const datos = await pedir(`/files/${fileKey}/nodes?ids=${ids.join(',')}&geometry=paths`);

let renders = {};
if (conPng) {
  const r = await pedir(`/images/${fileKey}?ids=${ids.join(',')}&format=png&scale=2`);
  renders = r.images ?? {};
}

for (const pantalla of objetivo) {
  const id = normalizarId(pantalla.node);
  const nodo = datos.nodes?.[id]?.document;
  if (!nodo) {
    console.error(`  ✗ ${pantalla.slug}: el nodo ${id} no vino en la respuesta (¿id mal escrito, o sin acceso?)`);
    continue;
  }

  const raiz = nodo.absoluteBoundingBox ?? { x: 0, y: 0, width: 0, height: 0 };
  const arbol = normalizar(nodo, raiz, 0);
  const spec = {
    slug: pantalla.slug,
    ruta: pantalla.ruta ?? null,
    fileKey,
    node: id,
    nombre: nodo.name,
    frame: { w: redondear(raiz.width), h: redondear(raiz.height) },
    generado: 'figma-pull.mjs',
    arbol,
  };

  fs.writeFileSync(path.join(SALIDA, `${pantalla.slug}.json`), JSON.stringify(spec, null, 2) + '\n');
  fs.writeFileSync(path.join(SALIDA, `${pantalla.slug}.md`), aMarkdown(spec));

  if (renders[id]) {
    const png = await fetch(renders[id]).then((r) => r.arrayBuffer());
    fs.writeFileSync(path.join(SALIDA, `${pantalla.slug}.png`), Buffer.from(png));
  }

  const capas = contar(arbol);
  console.log(`  ✓ ${pantalla.slug}  ${spec.frame.w}×${spec.frame.h}  ${capas} capas  →  figma/spec/${pantalla.slug}.{json,md}`);
}

// ---------------------------------------------------------------- normalizar

/**
 * Deja cada capa con lo que hace falta para escribirla en CSS, y nada más.
 * Las coordenadas quedan relativas al frame: (0,0) es la esquina del diseño,
 * no del lienzo de Figma.
 */
function normalizar(nodo, raiz, nivel) {
  const caja = nodo.absoluteBoundingBox;
  const out = {
    id: nodo.id,
    nombre: nodo.name,
    tipo: nodo.type,
  };

  if (nodo.visible === false) out.oculto = true;
  if (typeof nodo.opacity === 'number' && nodo.opacity !== 1) out.opacidad = redondear(nodo.opacity, 2);
  if (nodo.rotation) out.rotacion = redondear((nodo.rotation * 180) / Math.PI, 1);

  if (caja) {
    out.rect = {
      x: redondear(caja.x - raiz.x),
      y: redondear(caja.y - raiz.y),
      w: redondear(caja.width),
      h: redondear(caja.height),
    };
    // Para una capa rotada, `absoluteBoundingBox` es la caja alineada a los
    // ejes que ENVUELVE a la forma girada: un dino rotado 37° "mide" 363×389
    // cuando la imagen es de 185×294. `size` trae la medida real sin rotar,
    // que es la que hay que comparar contra el CSS.
    if (nodo.size) {
      out.tamano = { w: redondear(nodo.size.x), h: redondear(nodo.size.y) };
    }
    if (raiz.width) {
      out.pct = {
        x: redondear((100 * (caja.x - raiz.x)) / raiz.width, 2),
        w: redondear((100 * caja.width) / raiz.width, 2),
      };
    }
  }

  const relleno = (nodo.fills ?? []).filter((f) => f.visible !== false);
  if (relleno.length) out.relleno = relleno.map(pintura);

  const trazo = (nodo.strokes ?? []).filter((s) => s.visible !== false);
  if (trazo.length) {
    out.trazo = trazo.map(pintura);
    out.trazoAncho = nodo.strokeWeight ?? null;
    if (nodo.strokeAlign) out.trazoAlineacion = nodo.strokeAlign;
  }

  if (nodo.cornerRadius) out.radio = nodo.cornerRadius;
  if (nodo.rectangleCornerRadii) out.radio = nodo.rectangleCornerRadii;

  const efectos = (nodo.effects ?? []).filter((e) => e.visible !== false);
  if (efectos.length) out.efectos = efectos.map(efecto);

  if (nodo.type === 'TEXT') {
    const s = nodo.style ?? {};
    out.texto = nodo.characters;
    out.tipografia = limpiar({
      familia: s.fontFamily,
      postScript: s.fontPostScriptName,
      peso: s.fontWeight,
      tamano: s.fontSize,
      interlineado: s.lineHeightPx ? redondear(s.lineHeightPx) : null,
      interlineadoPct: s.lineHeightPercentFontSize ? redondear(s.lineHeightPercentFontSize, 1) : null,
      espaciado: s.letterSpacing ? redondear(s.letterSpacing, 2) : null,
      alineacion: s.textAlignHorizontal,
      alineacionV: s.textAlignVertical,
      transformacion: s.textCase,
      decoracion: s.textDecoration,
    });
  }

  if (nodo.layoutMode && nodo.layoutMode !== 'NONE') {
    out.autolayout = limpiar({
      direccion: nodo.layoutMode === 'HORIZONTAL' ? 'fila' : 'columna',
      gap: nodo.itemSpacing,
      padding: [nodo.paddingTop, nodo.paddingRight, nodo.paddingBottom, nodo.paddingLeft]
        .map((v) => v ?? 0)
        .join(' '),
      ejePrincipal: nodo.primaryAxisAlignItems,
      ejeCruzado: nodo.counterAxisAlignItems,
      envuelve: nodo.layoutWrap,
    });
  }

  if (nodo.constraints) {
    out.anclaje = `${nodo.constraints.horizontal}/${nodo.constraints.vertical}`;
  }

  if (nodo.clipsContent) out.recorta = true;

  const hijos = (nodo.children ?? []).filter((h) => h.visible !== false);
  if (hijos.length) out.hijos = hijos.map((h) => normalizar(h, raiz, nivel + 1));

  return out;
}

function pintura(p) {
  if (p.type === 'SOLID') {
    return limpiar({ tipo: 'solido', color: hex(p.color, p.opacity), opacidad: p.opacity !== 1 ? p.opacity : null });
  }
  if (p.type === 'IMAGE') {
    return limpiar({ tipo: 'imagen', ajuste: p.scaleMode, ref: p.imageRef });
  }
  if (p.type?.startsWith('GRADIENT')) {
    return {
      tipo: p.type.replace('GRADIENT_', 'degradado-').toLowerCase(),
      paradas: (p.gradientStops ?? []).map((s) => ({ pos: redondear(s.position, 3), color: hex(s.color, s.color.a) })),
    };
  }
  return { tipo: p.type };
}

function efecto(e) {
  const base = { tipo: e.type };
  if (e.type === 'DROP_SHADOW' || e.type === 'INNER_SHADOW') {
    return {
      ...base,
      x: e.offset?.x ?? 0,
      y: e.offset?.y ?? 0,
      blur: e.radius,
      spread: e.spread ?? 0,
      color: hex(e.color, e.color?.a),
      css: `${e.type === 'INNER_SHADOW' ? 'inset ' : ''}${e.offset?.x ?? 0}px ${e.offset?.y ?? 0}px ${e.radius}px ${e.spread ?? 0}px ${hex(e.color, e.color?.a)}`,
    };
  }
  return { ...base, blur: e.radius };
}

function hex(c, alfa) {
  if (!c) return null;
  const n = (v) => Math.round(v * 255).toString(16).padStart(2, '0');
  const a = alfa ?? c.a ?? 1;
  const base = `#${n(c.r)}${n(c.g)}${n(c.b)}`;
  return a >= 0.999 ? base.toUpperCase() : `${base}${n(a)}`.toUpperCase();
}

// ----------------------------------------------------------------- markdown

function aMarkdown(spec) {
  const l = [];
  l.push(`# ${spec.nombre}`);
  l.push('');
  l.push(`Frame \`${spec.node}\` · **${spec.frame.w}×${spec.frame.h}**${spec.ruta ? ` · ruta \`${spec.ruta}\`` : ''}`);
  l.push('');
  l.push('Coordenadas relativas al frame, en px de diseño. `x/y` es la esquina');
  l.push('superior izquierda de la capa. Generado por `scripts/figma-pull.mjs`:');
  l.push('no editar a mano, se regenera.');
  l.push('');
  l.push('| Capa | Tipo | x | y | w | h | Detalle |');
  l.push('| --- | --- | ---: | ---: | ---: | ---: | --- |');
  fila(spec.arbol, 0);
  l.push('');

  const textos = [];
  juntarTextos(spec.arbol, textos);
  if (textos.length) {
    l.push('## Textos');
    l.push('');
    l.push('| Capa | Contenido | Fuente | Tamaño | Interlineado | Color |');
    l.push('| --- | --- | --- | ---: | ---: | --- |');
    for (const t of textos) {
      const tg = t.tipografia ?? {};
      l.push(
        `| \`${t.nombre}\` | ${escapar(t.texto)} | ${tg.familia ?? '—'}${tg.peso ? ` ${tg.peso}` : ''} | ${tg.tamano ?? '—'} | ${tg.interlineado ?? '—'} | ${t.relleno?.[0]?.color ?? '—'} |`,
      );
    }
    l.push('');
  }

  return l.join('\n') + '\n';

  function fila(n, nivel) {
    const sangria = '·'.repeat(nivel);
    const r = n.rect ?? {};
    l.push(
      `| ${sangria}\`${n.nombre}\` | ${n.tipo} | ${r.x ?? ''} | ${r.y ?? ''} | ${r.w ?? ''} | ${r.h ?? ''} | ${detalle(n)} |`,
    );
    for (const h of n.hijos ?? []) fila(h, nivel + 1);
  }
}

function detalle(n) {
  const p = [];
  if (n.relleno?.length) {
    const f = n.relleno[0];
    p.push(f.tipo === 'solido' ? `fill ${f.color}` : `fill ${f.tipo}`);
  }
  if (n.radio) p.push(`radio ${Array.isArray(n.radio) ? n.radio.join('/') : n.radio}`);
  if (n.trazo?.length) p.push(`borde ${n.trazoAncho}px ${n.trazo[0].color ?? ''}`.trim());
  if (n.efectos?.length) p.push(n.efectos.map((e) => e.css ?? `${e.tipo} ${e.blur}`).join(' + '));
  if (n.autolayout) p.push(`autolayout ${n.autolayout.direccion} gap ${n.autolayout.gap ?? 0} pad ${n.autolayout.padding}`);
  if (n.opacidad) p.push(`opacidad ${n.opacidad}`);
  if (n.rotacion) p.push(`rotado ${n.rotacion}°`);
  if (n.tipografia) p.push(`${n.tipografia.familia ?? ''} ${n.tipografia.tamano ?? ''}px`.trim());
  return p.join(' · ') || '—';
}

function juntarTextos(n, acc) {
  if (n.tipo === 'TEXT') acc.push(n);
  for (const h of n.hijos ?? []) juntarTextos(h, acc);
}

// ---------------------------------------------------------------- utilidades

async function pedir(ruta) {
  const res = await fetch(API + ruta, { headers: { 'X-Figma-Token': token } });
  if (res.status === 403) salir('403: el token no tiene permiso sobre este archivo, o venció.');
  if (res.status === 404) salir('404: no existe ese archivo o ese nodo, o tu usuario no lo ve.');
  if (res.status === 429) {
    const espera = res.headers.get('retry-after');
    salir(`429: te pasaste de la cuota de la API. Reintentá en ${espera ?? '?'} s.`);
  }
  if (!res.ok) salir(`${res.status}: ${await res.text()}`);
  return res.json();
}

// Declaradas como function y no como const: el cuerpo del script corre antes
// que estas líneas, y una const acá arriba no existe todavía.
function normalizarId(id) {
  return id.replace('-', ':');
}
function redondear(v, d = 1) {
  return typeof v === 'number' ? Number(v.toFixed(d)) : v;
}
function rel(p) {
  return path.relative(RAIZ, p);
}
function escapar(s) {
  return String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ⏎ ');
}
function contar(n) {
  return 1 + (n.hijos ?? []).reduce((a, h) => a + contar(h), 0);
}

function limpiar(o) {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== null && v !== undefined));
}

function leerEnv(clave) {
  const env = path.join(RAIZ, '.env');
  if (!fs.existsSync(env)) return null;
  const linea = fs
    .readFileSync(env, 'utf8')
    .split('\n')
    .find((l) => l.trim().startsWith(`${clave}=`));
  return linea ? linea.slice(linea.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '') : null;
}

function salir(msg) {
  console.error(`\n${msg}\n`);
  process.exit(1);
}

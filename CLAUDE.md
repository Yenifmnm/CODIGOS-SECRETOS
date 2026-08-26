# CLAUDE.md — Códigos Secretos 2026

Microsite promocional de PuroSol. **Sólo frontend**: React 18 · Vite ·
TypeScript · React Router (HashRouter) · Framer Motion · CSS plano con custom
properties. Sin Tailwind, sin Bootstrap, sin librerías de UI.

```bash
npm run dev          # http://localhost:5180 (puerto fijo, strictPort)
npm run typecheck
npm run build
```

Contexto completo en `README.md`. Backend en `docs/`.

## La regla que más importa

**El diseño se lee de `figma/spec/`, no de una captura.**

Cuando haya que ajustar una pantalla para que coincida con el Figma:

1. Leé `figma/spec/<slug>.md` — ahí está la posición, el tamaño, el color, la
   tipografía y la sombra exactos de cada capa.
2. Si ese archivo no existe todavía, corré `npm run figma:pull <slug>` antes de
   escribir una línea de CSS.
3. **No estimes medidas mirando un PNG.** Si no tenés el número, decilo y pedí
   que se baje el spec; no inventes un valor que "se ve parecido".

El flujo completo está en `docs/FIGMA-WORKFLOW.md`.

## Cuál fuente manda

Cuando dos fuentes se contradicen, el orden es este y no se discute:

1. **El Figma** (`figma/spec/`, archivo `MYKVqv9sfUeVc6L3EFs94a`) — la verdad
   absoluta sobre composición, posiciones, proporciones, tipografía y color.
2. **`recursos/ajustes/Codigos Secretos 2026 - Web ajustes.pdf`** — lo que
   observó el cliente en la reunión de revisión. Vale para lo que el Figma no
   dice, o para cambios pedidos después del diseño. Si un ajuste del PDF
   contradice al Figma, se aplica el PDF **sólo si es evidente que es
   posterior**; ante la duda, preguntar antes de cambiar.
3. **Los PowerPoint** (`recursos/`) — lógica de participación, animaciones y
   storytelling. Nunca mandan sobre el layout.

Los assets originales del diseñador están en `recursos/mobile/` (elementos
sueltos) y `recursos/mobile/pantallas/` (el render de cada pantalla). Son
insumo: se miran, no se editan.

## Cómo se verifica que quedó bien

No alcanza con que se vea parecido en una captura. Antes de dar por terminada
una pantalla:

```bash
npm run figma:check <slug>
```

Compara lo que renderiza el navegador contra el spec, capa por capa, y devuelve
los desvíos en px. Seguí corrigiendo hasta que ninguna capa quede fuera de la
tolerancia (2 px por defecto). Si una diferencia es intencional, anotala en el
código con un comentario que diga por qué.

Todo elemento que posiciones vos —contenedores, imágenes grandes, bloques de
texto, botones— lleva el atributo del nodo del que salió:

```tsx
<img className="registro__pergamino" data-figma="23:3163" src={pergamino} alt="" />
```

Sin ese atributo, `figma:check` sólo puede decir *que* algo está mal, no *qué*.

**Contá las filas de la tabla contra las marcas que esperabas.** Si un número no
reacciona a un cambio, lo primero a descartar no es el CSS: es que el dev server
esté sirviendo un módulo viejo. Pasó —una capa desapareció de la tabla porque el
componente que la dibuja se seguía sirviendo sin el atributo—, y el único síntoma
fue que había una fila de menos. Un `touch` al archivo, o reiniciar `npm run dev`,
lo destraba. Sin esa cuenta, el reporte se lee como si estuviera midiendo lo que
acabás de escribir cuando en realidad mide lo anterior.

## Pantallas mobile

**Antes de tocar cualquier composición mobile, leé
`recursos/mobile/CLAUDE.md`.** Tiene los tamaños de frame, el mapa de pantalla a
export y las trampas de esos archivos.

Por debajo de 900 px (`useIsMobile`) cada pantalla renderiza una composición
vertical propia: **no** es la vista de escritorio encogida, y no se resuelve con
media queries sobre el layout de 1920.

## Convenciones del repo

- **Escala desktop**: el Figma es 1920×1080. `src/app/stage.ts` convierte
  coordenadas de diseño a `cqw` (`1cqw` = 19,2 px de diseño) y cada elemento usa
  `box({x, y, w, h})` con los números exactos del Figma. No uses
  `transform: scale()` sobre la página.
- **Nada de screenshots como fondo**: cada elemento es una capa independiente
  para poder animarlo.
- **Animaciones** sobre `transform`/`opacity`, nunca `top`/`left`/`width`/
  `height`. Respetar `prefers-reduced-motion`.
- **El frontend no decide nada** de la lógica de premios: enruta según el
  `status` que devuelve `src/services/promoApi.ts`.
- **Accesibilidad**: los botones son `<button>`, cada input tiene su `<label>`,
  la decoración va con `aria-hidden` y `pointer-events: none`.
- Comentarios y nombres en español, como el resto del repo.

## Qué no hacer

- No agregar dependencias sin preguntar. Playwright se instala a demanda
  (`npm i -D playwright`), no va en `package.json`.
- No subir `.env` ni el token de Figma. Nada de `VITE_FIGMA_*`: todo lo que
  empieza con `VITE_` termina dentro del JavaScript publicado.
- No tocar `recursos/` para guardar salidas de scripts: son insumos del
  diseñador. Lo generado va a `figma/spec/` y `figma/check/`.

# PuroSol — El Tesoro Galáctico de los Códigos Secretos 2026

Microsite promocional. **Sólo frontend.** No hay backend, base de datos, autenticación, validación real de códigos ni reglas de premio en este repositorio.

## Cómo verlo y cómo compartirlo

### 1. Mirarlo ya, sin instalar nada

`../demo/PuroSol-Tesoro-Galactico.html` — un único archivo de 3,3 MB con todo adentro (código, estilos e imágenes). Doble click y abre en el navegador. Funciona offline y se puede mandar por mail o WhatsApp tal cual.

Se regenera con:

```bash
npx vite build --config vite.demo.config.ts
```

y luego inlineando el JS/CSS en el HTML (ver `vite.demo.config.ts`).

### 2. Compartir un link con el cliente

La carpeta `dist/` (2,7 MB) es un sitio estático común. Sirve en cualquier hosting:

- **Netlify Drop** — `app.netlify.com/drop`, arrastrás la carpeta `dist` y te da una URL al toque.
- **Vercel** — `npx vercel --prod` desde la raíz del proyecto.
- **Cloudflare Pages / GitHub Pages** — subir `dist` como carpeta de publicación.

Está configurado con `base: './'` y `HashRouter`, así que anda igual en la raíz de un dominio o en un subdirectorio.

### 3. Desarrollar

```bash
npm install        # obligatorio antes del primer dev/build
npm run dev        # http://localhost:5173
npm run build      # dist/
npm run typecheck
```

---

## Fuentes del diseño

| Fuente | Qué aporta |
| --- | --- |
| Figma `BYiPd3K1fF5IbvSOhOQA9B` → `13:48 vistas web` | Composición, posiciones, proporciones, tipografía, color, assets |
| `_Codigos Secretos 2026 - Web - Cliente.pptx` | Animaciones, microinteracciones, storytelling |

Cuando ambos discrepan manda el Figma. La navegación implementada es la del Figma actual (píldora cian plegable), **no** el menú lateral amarillo del PowerPoint.

Cada pantalla lleva en su cabecera el nodo de Figma del que sale. Ningún fondo es un screenshot: todos los elementos son capas independientes para poder animarlos.

---

## Stack

React 18 · Vite · TypeScript · React Router (HashRouter) · Framer Motion · CSS plano con custom properties.

Sin Tailwind, sin Bootstrap, sin Material UI.

Framer Motion se usa sólo donde aporta (secuencia del ganador, carrusel). El resto del movimiento es CSS `transform`/`opacity`, y el catalejo usa `requestAnimationFrame` porque sigue al puntero.

---

## Sistema de escala

El Figma está sobre un lienzo de 1920×1080. En vez de escalar la página con `transform: scale()`:

- `.stage__inner` es un **container query** que mantiene 16:9 y cubre el viewport.
- `src/app/stage.ts` convierte coordenadas de diseño a `cqw` (`1cqw` = 19.2 px de diseño).
- Cada elemento usa `box({x, y, w, h})` con los números exactos del Figma.

Así la composición desktop escala proporcional y sin deformarse entre 1024 y 1920+.

**Por debajo de 900 px** (`useIsMobile`) cada pantalla renderiza una composición vertical propia — no es la vista desktop encogida. Prioridad: branding → mensaje → acción principal → contenido → decoración.

---

## Frontera con el backend

```
src/types/promo.ts        Contratos: Participant, RegistrationForm, PromoCode,
                          PromoCodeResult, Prize, UserCodeCount, SessionState, Terms
src/services/promoApi.ts  Interfaz PromoApi + export del adapter activo
src/services/mockPromoApi.ts   Implementación de desarrollo
src/mocks/scenarios.ts    Interruptor de escenarios
src/mocks/prizes.ts       Catálogo mock (assets originales del Figma)
```

Para conectar el backend real basta con **una línea**:

```ts
// src/services/promoApi.ts
export const promoApi: PromoApi = new HttpPromoApi(baseUrl); // antes: new MockPromoApi()
```

Ninguna pantalla toca `fetch`, ninguna decide si un código gana. El flujo (`src/app/useCodeFlow.ts`) sólo enruta según el `status` que devuelve el adapter.

### Probar los estados sin backend

Tres formas equivalentes:

1. Panel flotante abajo a la derecha (sólo en `npm run dev`).
2. Query string: `?scenario=WIN`
3. Consola: `window.__PROMO_SCENARIO__ = 'CODE_NOT_FOUND'`

Escenarios: `AUTO` (rota), `WIN`, `LOSE`, `CODE_ALREADY_USED`, `CODE_NOT_FOUND`, `REGISTER_REQUIRED`.

La latencia simulada (`MOCK_LATENCY_MS`, 750 ms) existe para poder ver los estados de carga.

---

## Pantallas

| Ruta | Figma | Notas |
| --- | --- | --- |
| `/` | `13:49` INICIO | Nave que entra, cofre interactivo, cúmulo de premios |
| `/participar` | `70:396` BIENVENIDOS | Cédula + código secreto |
| `/registro` | `17:2912` REGISTRO | Validación de formato en frontend |
| `/premios` | `57:86` PREMIOS | Carrusel de 5 ranuras |
| `/donde-esta-el-codigo` | `19:2982` | Catalejo-lupa sobre el pack |
| `/bases` | `22:3021` | Pergamino que se despliega |
| `/ganaste` | `23:3081` | Cofre se abre, el premio emerge |
| `/perdiste` | `23:3159` | Cofre cerrado con balanceo |
| `/codigo-utilizado` | `107:297` | |
| `/codigo-inexistente` | `131:131` | |

El menú plegado (`13:32`) está disponible en toda la navegación; en registro, carga de código y resultados arranca cerrado para no competir con el flujo.

---

## Inventario de animaciones (PPT)

| # | Animación | Dónde vive |
| --- | --- | --- |
| 1 | Lluvia de estrellas, 3 capas de profundidad | `components/effects/StarField.tsx` — un `<canvas>`, un solo `rAF`, `pointer-events: none` |
| 2 | Flotación asincrónica (4–12 px, 3–7 s, delays distintos) | `components/effects/FloatingLayer.tsx` |
| 3 | Nave entra desde la derecha → idle | `components/promo/PurosolShip.tsx` |
| 4 | Cofre del Home se abre con hover (tap en touch) | `components/promo/TreasureChest.tsx` |
| 5 | Glow en iconos y botones (hover / focus / active) | `PromoButton`, `RibbonButton`, `SiteMenu`, `CloseButton` |
| 6 | Menú que se despliega, con entrada escalonada | `components/navigation/SiteMenu.tsx` |
| 7 | Catalejo-lupa (mouse, touch y teclado), zoom 2.2× | `components/promo/TelescopeMagnifier.tsx` |
| 8 | Ganador: anticipación → apertura → luz → premio + holograma + partículas | `components/promo/PrizeReveal.tsx` |
| 9 | Cofre perdedor: respiración y balanceo sutiles | `TreasureChest` modo `idle` |
| 12 | Pergamino que se despliega + Ralph "leyendo" | `components/promo/Parchment.tsx`, `pages/Terms` |
| 13 | Carrusel de premios | `components/promo/PrizeCarousel.tsx` |
| 14 | Contador con la cifra en HTML real | `components/promo/CodeCounter.tsx` |
| 15 | Cursor ancla (sólo puntero fino, nunca en inputs) | `App.tsx` + `styles/global.css` |

---

## Accesibilidad y motion

- HTML semántico: todos los botones son `<button>`, los inputs tienen `<label>` asociado.
- Decoración con `aria-hidden` y `pointer-events: none`.
- Foco visible en cian, skip-link al contenido.
- Teclado: TAB, ENTER/SPACE, ESC cierra el menú, flechas mueven el carrusel y el catalejo.
- El catalejo no es la única vía: el contenido está descrito en texto.
- `prefers-reduced-motion: reduce` desactiva parallax, flotaciones y recorridos; las estrellas quedan fijas y el pergamino y el premio aparecen con un fundido. **El sitio sigue siendo completamente usable.**

---

## Performance

- Sólo el Home entra en el bundle inicial; el resto es `React.lazy`.
- Animaciones sobre `transform`/`opacity`; nunca `top`/`left`/`width`/`height`.
- Un único `rAF` para el starfield y otro para el catalejo, ambos cancelados al desmontar.
- Sin listeners por elemento decorativo.

---

## Pendientes / decisiones que conviene revisar con el cliente

1. **Tipografía `DK Prince Frog`.** No está en el repo por licencia. Ver `public/fonts/README.md`: al dejar el `.woff2` y descomentar el `@font-face` de `src/styles/tokens.css`, todo el sitio la toma. Mientras tanto usa Baloo 2 como fallback vía `--font-display`.
2. **Cofre en el Home.** El PPT lo pide (lám. 29) pero el Figma actual no lo ubica en INICIO. Está colocado en el espacio libre al pie del cúmulo de premios (`x 395, y 770`). Se mueve cambiando esa sola llamada a `box()` en `pages/Home/Home.tsx`.
3. **Texto de las bases.** Hoy es provisorio dentro de `mockPromoApi.getTerms()`. El componente ya acepta `termsHtml` o `termsText` desde backend.
4. **Etiqueta del código en pantallas de error.** En GANASTE y PERDISTE dice "CANJEASTE EL CÓDIGO" como en el Figma. En código utilizado / inexistente dice "CÓDIGO INGRESADO", porque ahí el código no se consumió. Se cambia con la prop `codeRedeemed` de `ResultLayout`.
5. **Iconos vectoriales menores** (hamburguesa, cruz de cerrar, cinta de los botones, iconos de los campos) están reconstruidos como SVG inline con la geometría y la paleta del Figma, porque no vinieron en la exportación de assets. Si el estudio los entrega, se reemplazan en `SiteMenu`, `CloseButton`, `RibbonButton` y `ParchmentField`.

# Prompt para Claude Code — Vista mobile de la microsite PuroSol

> Copiar todo lo que está debajo de la línea y pegarlo en Claude Code, parado en la carpeta `microsite/`.

---

ACTÚA COMO UN INGENIERO FRONTEND SENIOR ESPECIALIZADO EN REACT, MOTION DESIGN Y DESARROLLO MOBILE PIXEL-PERFECT A PARTIR DE DISEÑOS DE FIGMA.

## Objetivo

La vista **desktop** de la microsite "El Tesoro Galáctico de los Códigos Secretos 2026" ya está terminada y aprobada. Tu tarea es desarrollar la **vista mobile**, siguiendo los diseños de Figma que ya fueron exportados a este repositorio.

Hoy existe una versión mobile provisoria: cada pantalla renderiza una composición vertical genérica hecha con clases utilitarias (`.m-stack`, `.m-title`, `.m-sub`, `.m-art`) definidas en `src/styles/mobile.css`. **Eso es un placeholder.** Tenés que reemplazarlo por la composición real de cada pantalla del diseño mobile.

---

## Fuentes de verdad

### 1. Pantallas mobile (fuente de verdad visual)

`recursos/mobile/pantallas/` — un PNG por pantalla, a 402 px de ancho (iPhone, 402 pt lógicos).

**Abrí y mirá cada imagen antes de escribir código de esa pantalla.** No trabajes de memoria ni asumas que la composición mobile es la desktop reordenada: no lo es.

| Archivo | Ruta / componente |
| --- | --- |
| `landing.png` | `/` → `src/pages/Home/Home.tsx` |
| `vista menu desplegado.png` | Estado abierto de `src/components/navigation/SiteMenu.tsx` |
| `CI.png` | `/participar` → `src/pages/Welcome/Welcome.tsx` |
| `Registro.png` | `/registro` → `src/pages/Register/Register.tsx` |
| `Premios.png` | `/premios` → `src/pages/Prizes/Prizes.tsx` |
| `donde esta el codigo.png` | `/donde-esta-el-codigo` → `src/pages/CodeHelp/CodeHelp.tsx` |
| `bases y condiciones.png` | `/bases` → `src/pages/Terms/Terms.tsx` |
| `ganaste.png` | `/ganaste` → `src/pages/Winner/Winner.tsx` |
| `perdiste.png` | `/perdiste` → `src/pages/Loser/Loser.tsx` |
| `codigo utilizado.png` | `/codigo-utilizado` → `src/pages/CodeUsed/CodeUsed.tsx` |
| `codigo utilizado-1.png` | `/codigo-inexistente` → `src/pages/CodeNotFound/CodeNotFound.tsx` |
| `Group 2.png`, `Group 3.png` | Componentes sueltos (píldoras del menú desplegado). Confirmá abriéndolos |

Verificá vos mismo el mapeo de `codigo utilizado.png` vs `codigo utilizado-1.png` leyendo el texto de cada imagen: uno dice que el código **ya fue activado**, el otro que **no existe**.

Las pantallas de resultado miden 402×969 y el resto 402×913. La diferencia es contenido real, no un error.

**Importante:** las imágenes incluyen el chrome del sistema operativo — barra de estado con "9:41", señal y batería arriba, y la barra de gestos abajo. **Eso no se implementa.** Es sólo el marco del mockup.

### 2. Assets

`recursos/mobile/` — los PNG originales exportados de Figma.

**Antes de importar nada de ahí, revisá `src/assets/`.** La mayoría de estos assets ya están en el proyecto, convertidos a `.webp` y organizados por categoría (`backgrounds/`, `characters/`, `logos/`, `planets/`, `prizes/`, `promo/`, `ui/`, `effects/`). **Reutilizá esos.** No dupliques.

Sólo incorporá de `recursos/mobile/` lo que realmente no exista todavía en `src/assets/`. Cuando lo hagas:

- Convertilo a `.webp` (calidad 90–92) como el resto. El proyecto pasó de 13,6 MB a 2,3 MB de assets con esta conversión y hay que sostenerlo.
- Guardalo en la subcarpeta que le corresponde por categoría, con nombre en kebab-case.
- La carpeta tiene duplicados con sufijos `(1)`, `(2)`, etc. Deduplicá por hash antes de copiar.

**Nunca**: redibujar logos, reemplazar personajes por otra ilustración, usar emojis, usar íconos genéricos ni placeholders cuando el asset existe.

---

## Estado actual del proyecto

Leé el `README.md` antes de empezar. Resumen:

- **Stack:** React 18 + TypeScript (`strict`) + Vite 5 + React Router 6 (`HashRouter`) + Framer Motion. CSS plano con custom properties. Sin Tailwind, sin Bootstrap, sin Material UI. **Respetá esto, no agregues dependencias de UI.**
- **Tokens** (`src/styles/tokens.css`): `--font-display`, `--c-deep-blue #212f5c`, `--c-cyan #09eaff`, `--c-gold #fcc102`, `--c-brown #883307`, `--c-brown-dark #581f09`, `--c-orange #d8831c`. Usalos, no escribas hex sueltos.

### Cómo está resuelto el desktop

`src/components/layout/Stage.tsx` decide la composición:

```tsx
const isMobile = useIsMobile();          // < 900px
if (isMobile) return (/* rama mobile */);
return (/* rama desktop, lienzo 16:9 */);
```

Desktop posiciona todo con las coordenadas exactas del Figma (lienzo 1920×1080) convertidas a `cqw` mediante los helpers de `src/app/stage.ts` (`u()`, `box()`, `centeredText()`), dentro de un contenedor con `container-type: size`.

Cada pantalla recibe la composición mobile por la prop `mobile` de `<Stage>`. **Ahí es donde vas a trabajar.**

---

## Enfoque técnico para mobile

Replicá el mismo modelo mental que ya funciona en desktop, adaptado al lienzo de 402 px:

1. Creá `src/app/mobileStage.ts` con helpers análogos a `stage.ts`, pero con `DESIGN_W = 402`. Es decir, `1cqw` = 4,02 px de diseño. Exportá al menos `mu(px)` y `mbox({x, y, w, h})`.

2. Creá `src/components/layout/MobileStage.tsx`: un contenedor con `container-type: inline-size`, ancho `100%` y `max-width` acotado (sugerido `min(100vw, 520px)`, centrado), que sirva de sistema de coordenadas para toda la rama mobile.

   A diferencia del desktop, **la página mobile scrollea verticalmente**. No fuerces una altura fija de 913 px: usá las coordenadas Y del diseño como referencia de proporción y espaciado, pero permití que el contenido fluya.

3. Para los bloques de ilustración con superposiciones precisas (el cúmulo de premios y la nave en el landing, el cofre en los resultados, el pack en "dónde está el código"), armá **escenas** de proporción fija: un contenedor con `aspect-ratio` tomado del diseño y adentro los elementos posicionados con `mbox()`. Así las capas siguen siendo independientes y animables.

4. Para los bloques de texto y formulario, usá flujo normal (flex column con `gap`), con tamaños en `cqw` o `clamp()`. Nada de posicionamiento absoluto para texto que puede crecer.

5. Rango de funcionamiento: **320 px a 899 px** de ancho. Probá al menos 320, 360, 390, 402, 430 y 768. Sin overflow horizontal en ninguno.

6. Cuando termines de migrar todas las pantallas, borrá de `src/styles/mobile.css` las clases utilitarias que ya no use nadie (`.m-stack`, `.m-title`, `.m-sub`, `.m-art`, `.m-note`, `.m-chest`, `.m-row`, `.m-logo`). No dejes CSS muerto.

---

## Detalles del diseño mobile que ya se ven en las exportaciones

Verificá todo contra las imágenes; esto es orientación, no reemplazo de mirarlas.

### Menú (`landing.png` + `vista menu desplegado.png`)

- **Plegado:** píldora cian translúcida con el logo PuroSol a la izquierda y un botón circular con hamburguesa a la derecha. Arriba a la izquierda, con margen.
- **Desplegado:** el panel **crece hacia abajo**, no hacia el costado. El logo queda arriba y debajo aparecen tres píldoras claras apiladas: `CARGAR CÓDIGO`, `BASES Y CONDICIONES`, `PREMIOS`. Fondo del panel semitransparente, esquinas redondeadas.
- Ese orden es distinto al desktop (donde va CARGAR CÓDIGO / PREMIOS / BASES Y CONDICIONES). **Respetá el orden del mockup mobile.**
- El panel se superpone al contenido, no lo empuja.
- Animá la apertura: altura + opacidad + entrada escalonada de las píldoras. Sin saltos bruscos.

### Landing (`landing.png`)

Orden vertical: menú → logo Códigos Secretos → "Ganá un viaje al Caribe" (dorado) → "¡y cientos de premios más!" (blanco) → botón "Cargá acá tu código" → escena inferior con el planeta de premios a la izquierda (PlayStation, Nintendo, auriculares flotando) y la nave pirata a la derecha, ambos formando una sola composición.

### Participar (`CI.png`)

Logo → "¡Bienvenidos a bordo" / "Pequeños piratas!" → pergamino con el formulario (título, línea divisoria, campo Cédula con ícono, campo Código secreto con ícono, botón "Participar", link "¿Dónde encuentro el código secreto?") → escena inferior con portal y nave.

En mobile el pergamino ocupa casi todo el ancho y los campos son de ancho completo, con el ícono a la izquierda dentro de la cápsula.

---

## Reglas duras

1. **No toques la vista desktop.** Ni la composición, ni las coordenadas, ni el CSS que aplica arriba de 900 px. Si necesitás modificar un componente compartido, hacelo de forma aditiva (nueva prop, nueva clase) y verificá que desktop siga idéntico.

2. **No toques la capa de datos.** `src/types/promo.ts`, `src/services/promoApi.ts`, `src/services/mockPromoApi.ts` y `src/mocks/` quedan como están. No agregues `fetch`, endpoints, backend, base de datos, autenticación ni lógica de premios. Todo sigue viniendo de los mocks.

3. **No inventes contenido.** Nada de secciones, footers, navbars ni dashboards que no estén en el diseño. Los textos son los del mockup.

4. **Reutilizá componentes.** `PromoButton`, `RibbonButton`, `ParchmentField`, `CodeCounter`, `TreasureChest`, `PrizeCarousel`, `TelescopeMagnifier`, `Parchment`, `PrizeReveal`, `PurosolShip`, `StarField`, `FloatingLayer`, `Sparkles`, `CloseButton`, `SiteMenu` ya existen. Extendelos con variantes mobile antes de escribir uno nuevo.

5. **Nada de screenshots como fondo.** Prohibido usar los PNG de `recursos/mobile/pantallas/` como imagen de fondo para simular una pantalla. Son referencia visual. Cada elemento va como capa independiente para poder animarse.

---

## Animaciones en mobile

Todo lo que hay en desktop tiene que sobrevivir, adaptado al toque:

- **Lluvia de estrellas** de fondo, continua y sutil, con `pointer-events: none`.
- **Flotación asincrónica** de planetas, personajes, premios y destellos: amplitudes 4–12 px, duraciones 3–7 s, delays distintos entre elementos.
- **Nave** con animación de entrada y luego idle flotante.
- **Cofre del landing**: en touch se abre con **tap**, no con hover. Los premios que asoman salen de `MOCK_CHEST_PREVIEW`, es sólo visual.
- **Cofre ganador**: se abre y el premio emerge con destello, halo y partículas.
- **Cofre perdedor / errores**: cerrado, con balanceo y respiración muy sutiles.
- **Catalejo** en "dónde está el código": arrastrable con el dedo, fluido, con `touch-action: none` y `requestAnimationFrame`. No debe pelearse con el scroll de la página.
- **Carrusel de premios**: swipe horizontal + flechas.
- **Glow** en botones e íconos al tocarlos (`:active` además de `:hover` y `:focus-visible`).
- **Pergamino de bases** que se despliega al entrar.
- `@media (prefers-reduced-motion: reduce)`: sin parallax, sin movimientos infinitos, sólo fades. **El sitio tiene que seguir siendo usable.**

Animá siempre `transform` y `opacity`. Nunca `top`, `left`, `width` ni `height`. Cancelá todo rAF y timer al desmontar.

---

## Accesibilidad

- Botones reales (`<button>`), nunca `div` con `onClick`.
- Inputs con `<label>` asociado. Nada de placeholder como única etiqueta.
- `inputmode` correcto en cédula (`numeric`) y teléfono (`tel`).
- Áreas táctiles de 44×44 px mínimo.
- Decoración con `aria-hidden="true"`.
- Foco visible.
- Sin cursor personalizado en touch (ya está condicionado a `pointer: fine`).

---

## Forma de trabajo

No intentes hacer todo de una. Trabajá por fases y **compará visualmente contra el PNG correspondiente al terminar cada una**:

1. Inspeccionar el repo y abrir las 13 imágenes de `recursos/mobile/pantallas/`.
2. Inventariar qué assets faltan realmente en `src/assets/` y convertir sólo esos.
3. Crear `mobileStage.ts` + `MobileStage.tsx`.
4. Menú mobile (plegado y desplegado).
5. Landing.
6. Participar + Registro.
7. Resultados: Ganaste, Perdiste, Código utilizado, Código inexistente.
8. Premios, Dónde está el código, Bases y condiciones.
9. Limpieza de `mobile.css` y del CSS muerto.
10. QA.

---

## Criterios de aceptación

El trabajo no está terminado hasta que:

- [ ] Las 11 pantallas mobile reproducen fielmente su PNG de referencia.
- [ ] El menú desplegado se abre hacia abajo, con el orden y el estilo del mockup mobile.
- [ ] No se usó ningún screenshot como fondo.
- [ ] Los assets son los originales, en `.webp`, sin duplicados.
- [ ] La vista desktop quedó **exactamente igual** que antes (verificalo a 1920, 1440 y 1024).
- [ ] Funciona sin overflow horizontal de 320 px a 899 px.
- [ ] Las animaciones del listado están todas presentes y adaptadas a touch.
- [ ] Existe `prefers-reduced-motion`.
- [ ] `npx tsc --noEmit -p tsconfig.json` pasa limpio.
- [ ] `npm run build` pasa limpio.
- [ ] Sin errores ni warnings en consola.
- [ ] Sin imágenes rotas.
- [ ] Los cinco escenarios mock (`?scenario=WIN|LOSE|CODE_ALREADY_USED|CODE_NOT_FOUND|REGISTER_REQUIRED`) se recorren completos en mobile.
- [ ] No se agregó backend, base de datos, endpoints, tokens ni secretos.

Si algo del diseño mobile contradice lo que hay en desktop, **manda el diseño mobile** para la vista mobile — y avisámelo en el resumen final en lugar de cambiar el desktop por tu cuenta.

# Pantallas mobile — cómo trabajarlas

Esta carpeta es **insumo del diseño, no código**: acá viven los assets sueltos
que exportó el diseñador y, en `pantallas/`, el render de cada pantalla mobile.

No edites ni muevas nada de acá. Lo que generan los scripts va a `figma/spec/`
(el diseño en números) y `figma/check/` (las comparaciones).

## El orden de trabajo

Para cada pantalla mobile, siempre igual:

```bash
npm run figma:pull registro-mobile      # 1. el diseño en números → figma/spec/
                                        # 2. leer figma/spec/registro-mobile.md
                                        # 3. escribir el CSS con esos valores
npm run figma:check registro-mobile     # 4. medir
                                        # 5. corregir y volver al paso 4
```

El paso 2 no es opcional. **El PNG de `pantallas/` sirve para mirar, no para
sacar medidas**: de una imagen no se puede saber si un margen es 24 o 28, y
estimar doce veces por pantalla da algo que se parece pero no coincide.

## El mapa

| Slug | Ruta | Export de referencia | Frame |
| --- | --- | --- | --- |
| `inicio-mobile` | `#/` | `pantallas/landing.png` | 402×913 |
| `participar-mobile` | `#/participar` | `pantallas/CI.png` | 402×913 |
| `registro-mobile` | `#/registro` | `pantallas/Registro.png` | 402×913 |
| `premios-mobile` | `#/premios` | `pantallas/Premios.png` | 402×913 |
| `codigo-mobile` | `#/donde-esta-el-codigo` | `pantallas/donde esta el codigo.png` | 402×913 |
| `bases-mobile` | `#/bases` | `pantallas/bases y condiciones.png` | 402×913 |
| `ganaste-mobile` | `?scenario=WIN#/ganaste` | `pantallas/ganaste.png` | 402×969 |
| `perdiste-mobile` | `?scenario=LOSE#/perdiste` | `pantallas/perdiste.png` | 402×969 |
| `codigo-utilizado-mobile` | `?scenario=CODE_ALREADY_USED#/codigo-utilizado` | `pantallas/codigo utilizado.png` | 402×969 |

El mapa vivo está en `figma/nodes.json`; esta tabla es para leerla de un vistazo.

`pantallas/vista menu desplegado.png` es el menú abierto, no una ruta propia.
`Group 2.png` y `Group 3.png` son piezas sueltas (227×56 y 327×56), no
pantallas.

## Cuatro trampas de estos exports

1. **No todos miden igual.** Los resultados son 402×969 y el resto 402×913. Un
   render de 402×874 comparado contra un diseño de 402×969 da un diff enorme que
   no significa nada. Por eso `figma:check` toma el alto del frame del spec, o
   del PNG si no hay spec, y nunca uno fijo.

2. **Todos traen dibujada la barra de estado del teléfono.** Confirmado contra
   el archivo: cada frame mobile arranca con una instancia `Status bar - iPhone`
   en `x=0 y=0`, de **402×62**. Es el `9:41` con la señal y la batería. Esa
   barra la dibuja el SISTEMA, fuera del viewport de la página.

   **La decisión: se descuenta.** El cero del eje Y del sitio es el borde
   inferior de esa barra, no el borde del frame.

   Ojo si leíste la versión anterior de este archivo, que decía lo contrario
   —«no se compensa… el sitio deja esos 62 px libres arriba como área de la
   barra del sistema»—. Ese razonamiento contaba la barra dos veces: el sistema
   la dibuja afuera y encima la página le reservaba lugar adentro, con lo cual
   el contenido quedaba 62 px más abajo de lo que el diseño muestra respecto del
   borde visible. El frame pone la píldora del menú en y 79, o sea 17 px debajo
   de la barra; sin descontar, el sitio la ponía a 79 del borde de la página.

   **Vos no descontás nada.** Las coordenadas del spec se copian tal cual, con
   el cero en la esquina del frame. El descuento lo hace el contenedor una sola
   vez para las once pantallas (`src/components/layout/mobile-stage.css`) y
   `figma:check` hace la misma resta al comparar, leyendo el alto de la barra
   del propio spec. Si aparece un desvío vertical parejo de ~62 px en toda la
   pantalla, no muevas capa por capa: el problema está en el contenedor.

3. **El PNG trae la barra dibujada, y el render no.** Los exports de
   `pantallas/` están a 1:1 y con la barra de estado incluida, así que para el
   diff de píxeles `figma:check` les recorta esos 62 px de arriba. Sin ese
   recorte el overlay queda corrido de punta a punta y el porcentaje no quiere
   decir nada — y el overlay es lo que detectó, en bases, que el texto legal se
   montaba sobre la cinta y sobre el botón mientras la tabla de capas daba las
   16 en ✓.

4. **El PNG es una foto de un instante.** Las animaciones (nave, estrellas,
   cofre, destellos) están congeladas en un fotograma cualquiera. Un diff alto
   en esas zonas no es un error de layout. `figma:check` desactiva las
   animaciones del sitio antes de la captura, pero no puede hacer nada con el
   fotograma que eligió el diseñador.

## Dos atributos para los casos raros

- **Contenedor que scrollea** (los raíz de cada pantalla): marcalo igual, pero
  con `data-figma-ejes="x,w"`. El alto nunca va a coincidir con el del frame y
  sin esto sería un desvío permanente y falso.
- **Componente compartido por varios frames** (`ResultLayout` sirve a las cuatro
  pantallas de resultado, que en Figma son cuatro frames): listá los nodos
  separados por espacio, `data-figma="23:3159 23:3081 107:297 131:131"`. Gana el
  que exista en el spec de la pantalla que se está midiendo; si no está ninguno,
  el reporte lo marca «pertenece a otro frame» y no cuenta como falla.

## Lo que este control NO ve

`figma:check` mide **una foto quieta del estado inicial de cada ruta**. Compara
cajas y color. No mira **estados**, no mira **animaciones** y no mira
**gestos** — y las tres son la misma familia: cosas que sólo existen si algo
pasa, y en la foto no pasa nada.

Lo que queda afuera por estado: las miniaturas a la izquierda del carrusel de
PREMIOS, el menú desplegado (`menu-mobile`, que ni siquiera tiene ruta). Están
escritas y marcadas, y aun así nadie las compara.

**Van tres defectos por este hueco, y hay que contarlos juntos:**

| Defecto | Por dónde se coló |
| --- | --- |
| Las partículas del reveal de GANASTE, que no estaban en el diseño | Movimiento reducido: el componente devolvía `null` con `prefers-reduced-motion`, y el control mide justamente así |
| El carrusel de PREMIOS: dos miniaturas nunca medidas | `nodoDeRanura()` reparte las marcas según la posición activa, y la captura toma siempre la 0 |
| La lupa de `/donde-esta-el-codigo`, que dejaba la pantalla sin scroll | Un gesto. El control no toca nada: no hay dedo, no hay `touch-action`, no hay nada que medir |

No son tres descuidos distintos: es un agujero con tres salidas. Está anotado
como problema abierto en `docs/FIGMA-WORKFLOW.md`; hasta que se resuelva, leé
«0 fuera de tolerancia» como «0 en el estado inicial, quieto y sin tocar».

### El caso de las partículas: invisible por partida doble

En el reveal de GANASTE había unas partículas doradas (`Sparkles`) que **no
existían en el diseño**: en `ganaste-mobile` no hay ningún nodo que les
corresponda —alrededor del cofre el frame tiene sólo `glow-Photoroom 3`,
`glow-Photoroom 2` y los dos resplandores del propio `cofre 1`—. Estuvieron
puestas todo este tiempo y ningún control las marcó nunca. Por dos motivos, y
los dos son el mismo agujero:

1. **El reporte inverso no las podía listar.** Ese reporte va del spec al DOM:
   busca nodos del diseño sin contraparte. Lo que sobra en el código y no está
   en el diseño es el camino contrario, y nadie lo recorre.
2. **La captura tampoco las veía.** El componente hacía `if (reduced) return
   null`, y `figma:check` y `audit:responsive` miden con
   `reducedMotion: 'reduce'` para congelar las animaciones. O sea que en el
   único estado que se mide, las partículas no existían.

Lo segundo es exactamente la misma familia que el carrusel de PREMIOS: el
control mide UN estado y hay cosas que sólo viven en otro. Con el agravante de
que acá el estado no lo elige el usuario, lo elige el propio control.

Mientras eso siga así, «0 fuera de tolerancia» quiere decir «0 en el estado
inicial de esta ruta, con el movimiento reducido».

### El caso de la lupa: el control no toca la pantalla

El catalejo de `/donde-esta-el-codigo` tenía `touch-action: none`. Su caja mide
271x443 y cae en el centro exacto de la pantalla —el 43% de la altura, donde va
el pulgar—, así que **en el teléfono la página no scrolleaba**. Lo reportó la
clienta desde su celular; las diez pantallas seguían dando ✓ con 0 desvíos.

Ningún control lo podía ver, y no por falta de cobertura:

- `figma:check` compara geometría y color. `touch-action` no pinta un píxel.
- `audit:responsive` mide anchos a distintos viewports. Tampoco toca la pantalla.
- Playwright, por defecto, **usa mouse**. Con mouse el defecto no existe: el
  scroll con rueda no le pide permiso a `touch-action`. Hace falta un contexto
  con `hasTouch: true` y eventos de toque de verdad (`Input.dispatchTouchEvent`
  por CDP), porque `page.mouse` no sirve para reproducirlo.

De ahí salió `npm run audit:gestos` (`scripts/medir-gestos.mjs`): pasa un swipe
vertical por el centro de las diez pantallas y pregunta **qué** scrolleó. El
«qué» importa: en BASES el swipe mueve la hoja interna y no la ventana, y eso
está bien. La primera versión del script miraba sólo `window.scrollY` y contaba
BASES como falla.

Dos cosas que quedaron aprendidas del arreglo:

1. **`touch-action: pan-y` no alcanza solo, pero casi.** Medido: con el CSS
   nuevo y el JS viejo, Chromium ya devolvía el scroll (151 px) — el compositor
   decide antes de que corra nuestro código, así que `setPointerCapture` no le
   gana. Lo que seguía roto era otra cosa: el lente **saltaba bajo el dedo** en
   cada intento de scrollear y quedaba encendido, porque `pointerdown`
   capturaba y posaba el catalejo sin esperar a saber para qué venía el dedo.
2. **Por eso se decide por ángulo, no por evento.** No se captura nada hasta
   que el dedo recorre 8 px; ahí, si predomina lo vertical se suelta el gesto
   (el empate cae de ese lado a propósito) y si predomina lo horizontal recién
   se captura. Un toque que termina sin llegar al umbral no es scroll ni
   arrastre: posa el catalejo donde tocó, como antes.

### El contador en 0000 no es un bug

En `codigo-utilizado` y `codigo-inexistente` el contador muestra **0000**, y
está bien. `mockPromoApi.ts` sólo suma cuando el código se CONSUME:

```js
// Sólo los códigos efectivamente consumidos suman al contador.
const consumed = status === 'WIN' || status === 'LOSE';
```

Un código ya usado o inexistente no se consume, así que no suma. Verificado
recorriendo el flujo de verdad —participar → registro → perdiste, con la cédula
sin registrar, que es como entra un usuario nuevo—: ahí el contador da **0001**.
Abriendo `?scenario=CODE_ALREADY_USED#/codigo-utilizado` directamente da 0000,
que es lo correcto y además lo único que puede pasar: no hubo canje.

### La página 15B del PDF está DESCARTADA — no la implementes

En `recursos/ajustes/Codigos Secretos 2026 - Web ajustes.pdf` hay una página
**15B**, «carga de código con el participante ya identificado»: una versión de
PARTICIPAR con sólo el Código Secreto, sin el campo de cédula. Se implementó el
**25-08-2026** (`CodeOnlyMobile`, commit `b750330`) y se sacó el **27-08-2026**.

**La clienta no la quiere.** Textual: «participas una vez, y al darle clic a
"cargar otro código" me devuelve a esta pantalla pero ya sin el registro, sólo
me da el resultado del código que cargué», y sobre la pantalla de CI completa
—con cédula y código secreto—, «así debe verse, tal cual». Y: «así estaba antes,
no sé qué pasó». Lo que pasó fue ese commit.

Queda anotado acá justamente porque el PDF sigue teniendo esa página: si alguien
lo lee de nuevo va a creer que falta implementarla. **No falta: se descartó.**

Y ojo con leer el pedido como una sola cosa, que fue el error de fondo. Son DOS
requisitos y sólo uno toca a esta pantalla:

  a) después de «Cargar otro código» se vuelve a la pantalla de CI COMPLETA
     (frame `70:343`, cédula y código secreto) — eso es `Welcome.tsx`;
  b) al enviar desde ahí NO se pasa otra vez por el formulario de registro —
     eso lo resuelve `useCodeFlow`, y no se toca.

El campo de cédula queda **vacío**, como el frame. No se precarga con la de la
sesión aunque parezca más cómodo: el diseño no lo tiene.

Con esto se van las doce marcas `data-figma="TODO"`, que eran las únicas del
proyecto, y PARTICIPAR deja de ser uno de los casos del problema abierto de
`docs/FIGMA-WORKFLOW.md`: ya no tiene un estado sin frame.

## Los assets

Los `.png` sueltos de esta carpeta son los originales del diseñador. Los que usa
el sitio ya están convertidos a `.webp` en `src/assets/`. Si falta uno, se
convierte y se agrega ahí — **no** se importa desde `recursos/`, que no entra en
el build.

Ojo con los duplicados: hay archivos como `CODIGO 1 (1).png` … `(10).png` que
son exports repetidos del mismo elemento. Antes de agregar uno nuevo, fijate si
el equivalente ya existe en `src/assets/`.

# Cómo hacer que una pantalla quede igual al Figma

Pasarle un PNG a un agente y pedirle "hacelo igual" no funciona, y el motivo es
simple: en una imagen no está el número. ¿Ese margen es 24 o 28? ¿Ese texto es
18 o 20? ¿El pergamino está a 120 del borde o a 132? El agente estima, y estimar
doce veces por pantalla da un resultado que *se parece* pero no coincide.

Este flujo cambia dos cosas:

1. **La fuente pasa a ser el número, no la imagen.** `figma-pull.mjs` baja de
   Figma la posición, el tamaño, el color, la tipografía y la sombra de cada
   capa, y los deja en `figma/spec/`.
2. **Hay una forma de comprobar.** `figma-check.mjs` mide lo que dibuja el
   navegador y lo compara contra ese spec, capa por capa, en píxeles. El agente
   deja de adivinar si quedó bien: lo mide, corrige y vuelve a medir.

La imagen sigue sirviendo — pero como control al final, no como fuente al
principio.

---

## Preparar (una sola vez)

### 1. El token de Figma

En figma.com: foto de perfil → **Configuración** → **Seguridad** → **Tokens de
acceso personal** → generar uno con permiso de lectura de archivos.

Va en `.env`, que no se sube al repo:

```
FIGMA_TOKEN=figd_...
```

No lleva el prefijo `VITE_` a propósito: todo lo que empieza con `VITE_` termina
dentro del JavaScript publicado y cualquiera lo puede leer.

### 2. Los node id de cada frame

`figma/nodes.json` mapea cada pantalla del sitio a su frame de Figma. Los frames
de escritorio ya están cargados; **los mobile dicen `TODO`**.

Para completarlos: en Figma, clic derecho sobre el frame → **Copiar enlace**. El
link trae `?node-id=23-3159`; ese es el id (con guion o con dos puntos, da
igual, el script normaliza).

### 3. Playwright

No es dependencia del proyecto, para no engordar el despliegue. Se instala a
demanda, igual que para `audit:responsive`:

```bash
npm i -D playwright && npx playwright install chromium
```

---

## El ciclo

```bash
npm run figma:pull registro-mobile     # 1. bajar el diseño exacto
npm run dev                            # 2. (en otra terminal)
npm run figma:check registro-mobile    # 3. medir lo que hay
#    ... corregir el CSS ...
npm run figma:check registro-mobile    # 4. volver a medir
```

### 1. `figma:pull` — bajar el diseño

```bash
npm run figma:pull registro-mobile     # una pantalla
npm run figma:pull -- --all --png      # todas, con render de referencia
```

Escribe en `figma/spec/`:

| Archivo | Qué es |
| --- | --- |
| `<slug>.json` | el árbol completo: `rect` de cada capa relativo al frame, colores en hex, tipografía, radios, sombras con su CSS ya armado, autolayout |
| `<slug>.md` | lo mismo en tabla — **esto es lo que se le pasa al agente**, no el PNG |
| `<slug>.png` | el render de referencia, sólo con `--png` |

Las coordenadas son **relativas al frame**: `(0,0)` es la esquina del diseño, no
del lienzo de Figma. Eso es lo que se traduce a CSS sin hacer cuentas.

### 2. `figma:check` — medir

```bash
npm run figma:check registro-mobile
npm run figma:check -- --all
```

Hace dos comprobaciones distintas, y la primera es la que importa:

**Capa por capa.** Todo elemento del DOM con `data-figma="23:3163"` se mide y se
compara contra ese mismo nodo en el spec. Sale una tabla así:

```
✗ registro-mobile  402×913  14 capas medidas, 3 fuera de 2px
    pergamino (23:3163): 0.0x +14.0y 0.0w -8.0h
    dino (23:3170): -6.0x +2.0y 0.0w 0.0h
```

Eso es accionable: *el pergamino está 14 px más abajo y 8 px más bajo de lo que
dice el diseño*. Una captura no dice eso.

**Píxel a píxel.** Escribe en `figma/check/<slug>/`:

- `render.png` — lo que dibuja el sitio
- `diff.png` — en rojo lo que no coincide
- `overlay.png` — el diseño al 50% encima del render, para mirar a ojo
- `reporte.md` — el resumen

Devuelve código 1 si algo quedó fuera de tolerancia, así que sirve en CI.

Variables: `TOL=2` (px de tolerancia), `UMBRAL=32` (cuánto tiene que diferir un
píxel para contar), `BASE=http://localhost:5180`.

### 3. Marcar las capas con `data-figma`

Sin esto sólo hay comparación por píxel, que dice *que* algo está mal pero no
*qué*. Marcar es una línea por elemento:

```tsx
<img className="registro__pergamino" data-figma="23:3163" src={pergamino} alt="" />
```

No hace falta marcar todo: alcanza con los elementos que posicionás vos —
contenedores, imágenes grandes, bloques de texto, botones—. Ocho o diez por
pantalla ya cierran el ciclo. El atributo no molesta en producción y sirve de
documentación de dónde salió cada cosa.

Hay dos casos que no entran en el molde, y cada uno tiene su atributo:

**Un contenedor que scrollea.** El alto real nunca va a coincidir con los 913 o
969 px del frame, así que compararlo sería un desvío permanente y falso. Se
declara qué ejes cuentan:

```tsx
<main className="register-m" data-figma="17:2912" data-figma-ejes="x,w">
```

Los demás ejes se siguen midiendo y se muestran en el reporte, pero no deciden
si la capa pasa.

**Un componente compartido por varios frames.** Las cuatro pantallas de
resultado son una sola composición en el código (`ResultLayout`) y cuatro frames
distintos en Figma. Se listan los nodos separados por espacio y gana el que
exista en el spec de la pantalla que se está midiendo:

```tsx
<section data-figma="23:3159 23:3081 107:297 131:131">
```

Si ninguno está en ese spec, el reporte lo marca «pertenece a otro frame» y no
lo cuenta como falla.

**Capas rotadas: no hace falta hacer nada, pero conviene saber qué pasa.** Para
una capa girada, la API no devuelve la medida de la imagen sino la caja alineada
a los ejes que **envuelve** a la forma rotada: un dino rotado 37° "mide" 363×389
cuando la imagen es de 185×294. Perseguir ese número rompería lo que está bien.
`figma:pull` guarda además el tamaño real en `tamano`, y `figma:check` detecta
la rotación solo: compara **centro contra centro** —rotar un rectángulo no mueve
su centro— y usa `tamano` para el ancho y el alto. En el reporte esas capas
aparecen como «rotada -37.3°, centro», y por defecto sólo deciden por posición:
el ancho de un asset rotado depende de cuánto margen transparente le dejó el
diseñador al exportarlo, que no es un dato de diseño.

---

### La pintura: lo que no mueve la caja

`figma:check` no compara sólo geometría. Por cada capa marcada también verifica
contra el spec:

| | |
| --- | --- |
| **color** | del texto, o el relleno sólido de una caja |
| **tipografía** | que la familia del diseño esté realmente aplicada |
| **cuerpo, interlineado, espaciado** | en px de diseño, escalados al lienzo |
| **transformación y alineación** | `uppercase`, `center`, etc. |
| **opacidad y radios** | |
| **trazo** | ancho, color y **orden de pintado** |
| **sombras** | busca en `text-shadow`, `box-shadow` y `filter` a la vez |

Esto existe porque la tabla de capas puede dar **todo en cero y la pantalla
verse distinta igual**: un título con el resplandor del color equivocado, una
etiqueta en otro tono, o —el más silencioso— un texto que cayó en la tipografía
sustituta porque la licenciada no cargó. Ninguna de esas tres mueve un píxel de
la caja.

Sale en su propia sección del reporte, con el valor del diseño y el del sitio
lado a lado.

Cuando el color no lo pinta el elemento marcado sino un hijo, se lo saca del
control con `data-figma-omitir="pintura"`. También acepta claves sueltas —
`data-figma-omitir="fondo,sombras"`— para omitir una sola propiedad en vez de
todas.

**El orden de pintado del trazo.** CSS por defecto dibuja el relleno y **encima**
el trazo, así que un trazo centrado de 2 px se come 1 px de letra por todo el
contorno: el texto queda pálido y hueco, y el borde se lee como un contorno duro
en vez de un filo. Figma lo muestra al revés. Por eso, si el nodo declara trazo
sobre un texto, el control exige `paint-order: stroke fill`.

**Dos conversiones que conviene no equivocar:**

- Una sombra de Figma (`DROP_SHADOW`) va **1:1** al radio de CSS. El `÷2` es
  para el desenfoque de capa (`LAYER_BLUR`) contra `filter: blur()`, que es
  otra cosa.
- Sobre texto va con `text-shadow`, que sigue la forma de las letras. Sobre una
  imagen con transparencia, con `filter: drop-shadow()`, que sigue el alfa.
  `box-shadow` dibujaría el rectángulo de la caja.

El spec ya trae cada efecto con su CSS armado en el campo `css`: usá ese valor
en vez de recalcularlo.

---

## Ojo con el alto del frame

Los exports mobile no miden todos igual: `landing`, `Registro`, `Premios`,
`bases` y `donde esta el codigo` son **402×913**, mientras que `ganaste`,
`perdiste` y `codigo utilizado` son **402×969**. Y varios traen la barra de
estado del teléfono dibujada arriba (el `9:41` con la señal y la batería), que
el sitio no dibuja.

Esos ~55 px de diferencia corren todo el contenido hacia abajo y ensucian
cualquier comparación. Por eso `figma:check` toma el alto del frame del spec o,
si no hay spec todavía, del PNG de referencia — nunca uno fijo. Si el frame de
Figma incluye la barra de estado, hay que decidir una vez si se descuenta del
origen o si se compara igual, y anotarlo acá.

---

## La otra puerta: el MCP de Figma en Claude Code

La API REST y el MCP devuelven la misma data; cambia por dónde entra y qué cuota
gasta. Tener las dos sirve: el MCP es cómodo para preguntar puntual mientras
programás, y `figma:pull` deja el spec versionado en el repo, que es lo que hace
reproducible el trabajo.

Para agregarlo en Claude Code:

```bash
claude mcp add --transport http figma https://mcp.figma.com/mcp
```

Después `/mcp` para autorizar con la cuenta de Figma.

Dos condiciones que no son obvias:

- Hace falta puesto **Dev o Full** en un plan **Profesional** o superior. Con
  puesto View o Collab son 6 llamadas por mes y no alcanza para nada.
- **La cuota se le cobra al equipo dueño del archivo, no a tu cuenta.** Un
  archivo en Borradores o en un equipo Starter aplica el tope de Starter (20
  llamadas por mes) aunque vos tengas puesto Dev en el equipo Pro. Si el MCP
  responde "You've reached the Figma MCP tool call limit on the Starter plan",
  el problema es dónde vive el archivo, no tu puesto: hay que moverlo al equipo
  Pro.

Los límites completos están en
[developers.figma.com/docs/figma-mcp-server/rate-limits-access](https://developers.figma.com/docs/figma-mcp-server/rate-limits-access/).

---

## Resumen para pegar en un prompt

> Antes de tocar el CSS de una pantalla, leé `figma/spec/<slug>.md`: ahí está la
> posición, el tamaño, el color y la tipografía exactos de cada capa. No estimes
> medidas de una captura. Marcá con `data-figma="<nodeId>"` los elementos que
> posiciones. Cuando termines, corré `npm run figma:check <slug>` y seguí
> corrigiendo hasta que ninguna capa quede fuera de la tolerancia.

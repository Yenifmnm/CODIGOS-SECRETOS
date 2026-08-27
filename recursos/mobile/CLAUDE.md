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

`figma:check` mide **una foto del estado inicial de cada ruta**. Lo que sólo
existe después de una interacción no se compara, aunque esté escrito y marcado:
las miniaturas a la izquierda del carrusel de PREMIOS, el menú desplegado
(`menu-mobile`, que ni siquiera tiene ruta) y la variante de PARTICIPAR con el
código ya cargado. Los tres son estados, no rutas, y ninguna cobertura los
alcanza. Está anotado como problema abierto en `docs/FIGMA-WORKFLOW.md`; hasta
que se resuelva, leé «0 fuera de tolerancia» como «0 en el estado inicial».

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

### `CodeOnlyMobile` está a la espera del frame

La variante de PARTICIPAR con el código ya cargado **no tiene frame en Figma**.
Funciona, y sus doce marcas siguen en `TODO` A PROPÓSITO: no hay nodo contra el
cual medirlas. No se rediseña ni se le inventan coordenadas hasta que llegue el
frame de la diseñadora.

Y es, además, uno de los tres casos del problema abierto de
`docs/FIGMA-WORKFLOW.md`: es un ESTADO y no una ruta, así que ningún control la
alcanza.

## Los assets

Los `.png` sueltos de esta carpeta son los originales del diseñador. Los que usa
el sitio ya están convertidos a `.webp` en `src/assets/`. Si falta uno, se
convierte y se agrega ahí — **no** se importa desde `recursos/`, que no entra en
el build.

Ojo con los duplicados: hay archivos como `CODIGO 1 (1).png` … `(10).png` que
son exports repetidos del mismo elemento. Antes de agregar uno nuevo, fijate si
el equivalente ya existe en `src/assets/`.

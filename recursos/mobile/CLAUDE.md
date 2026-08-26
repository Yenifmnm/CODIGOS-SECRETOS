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

## Tres trampas de estos exports

1. **No todos miden igual.** Los resultados son 402×969 y el resto 402×913. Un
   render de 402×874 comparado contra un diseño de 402×969 da un diff enorme que
   no significa nada. Por eso `figma:check` toma el alto del frame del spec, o
   del PNG si no hay spec, y nunca uno fijo.

2. **Todos traen dibujada la barra de estado del teléfono.** Confirmado contra
   el archivo: cada frame mobile arranca con una instancia `Status bar - iPhone`
   en `x=0 y=0`, de **402×62**. Es el `9:41` con la señal y la batería. El sitio
   no la dibuja, así que el contenido del diseño empieza 62 px más abajo que el
   del render.

   **La decisión: no se compensa.** Las coordenadas del spec se usan tal cual,
   con el origen en la esquina del frame, y el sitio deja esos 62 px libres
   arriba como área de la barra del sistema —que en un teléfono real existe—.
   Si al comparar aparece un desvío vertical parejo de ~62 px en toda la
   pantalla, no muevas capa por capa: el problema está en el contenedor.

3. **El PNG es una foto de un instante.** Las animaciones (nave, estrellas,
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

## Los assets

Los `.png` sueltos de esta carpeta son los originales del diseñador. Los que usa
el sitio ya están convertidos a `.webp` en `src/assets/`. Si falta uno, se
convierte y se agrega ahí — **no** se importa desde `recursos/`, que no entra en
el build.

Ojo con los duplicados: hay archivos como `CODIGO 1 (1).png` … `(10).png` que
son exports repetidos del mismo elemento. Antes de agregar uno nuevo, fijate si
el equivalente ya existe en `src/assets/`.

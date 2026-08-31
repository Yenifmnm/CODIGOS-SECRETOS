# Las cintas del pergamino

Un SVG por nodo, y el nombre del archivo **es** el id del nodo. No es pereza:
cada cinta del diseño es un vector dibujado a mano con su propia silueta de
papel rasgado —muescas distintas, bordes distintos, anchos distintos— así que lo
único que la identifica es de qué nodo salió.

Se bajan del Figma, no se dibujan:

```bash
npm run figma:pull -- --export 73:934,73:937 --formato svg
```

Y el export trae el color y el alfa adentro: las cuatro cintas plenas vienen en
`#D8831C` y las seis de campo en `#D8831C` con `fill-opacity="0.5"`, que es el
`#D8831C80` del spec.

| Archivo | Nodo | Dónde | Medida |
| --- | --- | --- | ---: |
| `73-614.svg` | `73:614` | registro · titular, primer renglón | 221×25 |
| `73-643.svg` | `73:643` | registro · titular, segundo renglón | 146×24 |
| `73-613.svg` | `73:613` | registro · campo Nombre y Apellido | 260×25 |
| `73-629.svg` | `73:629` | registro · campo Email | 260×25 |
| `73-612.svg` | `73:612` | registro · campo Fecha de nacimiento | 124×24 |
| `73-633.svg` | `73:633` | registro · campo Número de cédula | 124×24 |
| `73-636.svg` | `73:636` | registro · campo Ciudad | 124×24 |
| `73-639.svg` | `73:639` | registro · campo Teléfono | 124×24 |
| `73-621.svg` | `73:621` | registro · botón Registrarme | 101×20 |
| `73-624.svg` | `73:624` | registro · botón Cancelar | 101×20 |
| `73-934.svg` | `73:934` | bases · cinta del titular | 240×43 |
| `73-937.svg` | `73:937` | bases · cinta del botón | 147×39 |

**Antes había un `clip-path: polygon()` genérico de seis puntos** haciendo de
silueta para las doce. Se veía como un chevrón igual en todas, y en `bases` ni
siquiera era intencional: el bloque mobile no reseteaba el `clip-path` y heredaba
el del bloque de escritorio.

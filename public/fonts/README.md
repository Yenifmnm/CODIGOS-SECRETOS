# Tipografía

El sitio usa **Chewy** (Google Fonts, OFL, uso comercial permitido). La carga
`index.html` y `--font-display` la nombra primero; en esta carpeta no va ningún
archivo de fuente.

## Por qué no es la del Figma

El diseño está dibujado con **DK Prince Frog**, de Hanoded. Es comercial y su
licencia no habilita el uso web, así que **no se usa y no se va a comprar**: la
decisión está tomada y la sustitución es definitiva. No hay nada que reponer,
descomentar ni pedir.

Chewy se eligió midiendo contra la original: mismo peso de trazo, mismo redondeo
de marcador y línea de base irregular. Es la más cercana de las libres.

## Lo que hay que tener presente

Chewy es un 4-5 % más ancha que DK Prince Frog al mismo cuerpo. Donde el diseño
declara un tamaño, el texto ocupa un poco más de lo que muestra el mockup, y en
las cajas justas eso obliga a decidir: bajar el cuerpo, o aceptar que el texto
se parta en un renglón más. Las dos decisiones están anotadas en el CSS de cada
pantalla, con el número que las motivó.

La sustitución está declarada en `figma/nodes.json`:

```json
"tipografias": { "DK Prince Frog": "Chewy" }
```

`figma:check` acepta cualquiera de las dos donde el spec pide la del diseño, y
sigue avisando si un texto cae en una tercera fuente, que es el error real.

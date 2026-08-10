# Tipografía

El diseño usa **DK Prince Frog**, de Hanoded (David Kerkhoff).

## Por qué no está en el repo

La versión que circula gratis en dafont / 1001freefonts es una **demo recortada,
free for personal use ONLY**, sin derechos de embebido. Este sitio es una promo
comercial, así que esa versión no sirve: hay que comprar la licencia completa.

- Comprar: <https://www.myfonts.com/collections/prince-frog-font-hanoded> —
  desde USD 15, una sola variante. También en fontspring.com y hanodedfonts.com.
- Al comprar hay que pedir/incluir la **licencia webfont**, no sólo la desktop:
  la desktop no habilita a servir la fuente desde el sitio.

## Cómo activarla

1. Copiar `DKPrinceFrog.woff2` en esta carpeta (ese nombre exacto).
2. Listo. El `@font-face` ya está declarado en `src/styles/tokens.css` y
   `--font-display` la busca primero.

Si el archivo no está, la regla falla en silencio y el navegador pasa al
siguiente nombre del stack. No hay nada que comentar ni descomentar.

## Mientras tanto

El stack cae en **Chewy** (Google Fonts, OFL, uso comercial permitido), elegida
por medición contra el Figma: mismo peso de trazo, mismo redondeo de marcador y
línea de base irregular. Es la más cercana de las libres.

Queda una diferencia que conviene tener presente: DK Prince Frog es más
condensada. El mismo texto a 42 px mide ~710 px con la original y ~819 px con
Chewy (+15 %). Por eso el título de REGISTRO está a 36 px en vez de los 42 del
Figma — ver el comentario en `src/pages/Register/Register.tsx`. Al incorporar la
tipografía licenciada conviene volver a 42.

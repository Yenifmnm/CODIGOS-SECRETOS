# Tipografía

El diseño usa **DK Prince Frog**. La licencia no viene incluida en este repo.

Para activarla:

1. Copiar `DKPrinceFrog.woff2` (y opcionalmente `.woff`) en esta carpeta.
2. Descomentar el bloque `@font-face` en `src/styles/tokens.css`.

Hasta entonces la variable `--font-display` cae en un stack display alternativo
(Baloo 2), de proporciones y peso similares. No hace falta tocar nada más:
todos los textos del sitio consumen `--font-display`.

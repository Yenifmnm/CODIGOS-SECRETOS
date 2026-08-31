import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Las imágenes que el PRIMER PINTADO de la landing necesita sí o sí.
 *
 * Medido contra el build publicado, antes de este cambio: las quince imágenes
 * de `#/` se descubrían todas entre 634 y 640 ms, o sea DESPUÉS de bajar el JS,
 * ejecutarlo y que React renderizara. El fondo terminaba a 2.678 ms y el logo a
 * 2.447. Un `preload` en el HTML las hace empezar junto con el documento, sin
 * esperar al JS.
 *
 * Los nombres van SIN hash: el hash lo resuelve el plugin leyendo el bundle. A
 * mano se rompe en el próximo build.
 */
const CRITICAS_LANDING = [
  'fondo-mobile.webp',            // el cielo, la capa de abajo de todo
  'codigos-secretos.webp',        // el logo
  'codigos-secretos-halo.webp',   // su resplandor, que va horneado en una imagen
];

/**
 * Inyecta `<link rel="preload" as="image">` con el nombre YA HASHEADO.
 *
 * En `dev` no hace nada: ahí no hay bundle ni hash, y Vite sirve las imágenes
 * por su ruta original.
 *
 * Si un nombre deja de existir —porque alguien renombró el asset— el build
 * FALLA en vez de seguir sin el preload. Un preload que se pierde en silencio
 * no lo nota nadie hasta que el sitio vuelve a cargar lento.
 */
function preloadCriticas(nombres: string[]): Plugin {
  return {
    name: 'preload-criticas',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        if (!ctx.bundle) return html;
        /* El hash va ANCLADO AL FINAL y sin guiones adentro. Con
           `-[A-Za-z0-9_-]{8,}` el guion del patrón hacía que
           `fondo-mobile-psSpVCnZ.webp` empezara a matchear en el PRIMER guion y
           devolviera «fondo.webp», que no coincidía con nada. */
        const sinHash = (ruta: string) =>
          ruta.split('/').pop()!.replace(/-[A-Za-z0-9_]{8,}(\.[^.]+)$/, '$1');
        const tags = nombres.map((nombre) => {
          const clave = Object.keys(ctx.bundle!).find((k) => sinHash(k) === nombre);
          if (!clave) {
            throw new Error(
              `preload-criticas: no encontré «${nombre}» en el bundle.\n` +
                'Si el asset se renombró, actualizá CRITICAS_LANDING en vite.config.ts.',
            );
          }
          return {
            tag: 'link',
            attrs: {
              rel: 'preload',
              as: 'image',
              href: `./${clave}`,
              fetchpriority: 'high',
            },
            injectTo: 'head-prepend' as const,
          };
        });
        return { html, tags };
      },
    },
  };
}

export default defineConfig({
  plugins: [react(), preloadCriticas(CRITICAS_LANDING)],
  base: './',
  // 5173 (default de Vite) está ocupado por otro proyecto en esta máquina.
  server: { port: 5180, strictPort: true, host: true },
  preview: { port: 5181, strictPort: true },
  build: { assetsInlineLimit: 2048 },
});

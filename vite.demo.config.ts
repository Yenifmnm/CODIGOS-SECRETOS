import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Build de demo: un único archivo .html autocontenido.
 * Sirve para abrir el sitio con doble click, sin servidor ni npm install.
 * Para desarrollar usá el build normal (vite.config.ts).
 */
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'demo-build',
    // Todos los assets como data URI y un solo bundle JS.
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
    cssCodeSplit: false,
    rollupOptions: {
      output: { inlineDynamicImports: true },
    },
  },
});

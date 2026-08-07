import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  // 5173 (default de Vite) está ocupado por otro proyecto en esta máquina.
  server: { port: 5180, strictPort: true, host: true },
  preview: { port: 5181, strictPort: true },
  build: { assetsInlineLimit: 2048 },
});

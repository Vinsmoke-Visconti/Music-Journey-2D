import { defineConfig } from 'vite';

export default defineConfig({
  // Base path cho deployment (GitHub Pages dùng '/music-journey-2d/')
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
  },
  server: {
    port: 3000,
    open: true,
  },
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { rm } from 'node:fs/promises';

const cleanGeneratedAssets = () => ({
  name: 'clean-generated-assets',
  apply: 'build',
  async buildStart() {
    await rm(new URL('../public/assets', import.meta.url), { recursive: true, force: true });
  },
});

export default defineConfig({
  plugins: [react(), cleanGeneratedAssets()],
  server: {
    port: 5173,
    proxy: {
      '/ws': {
        target: 'ws://localhost:3000',
        ws: true,
      },
    },
  },
  build: {
    outDir: '../public',
    emptyOutDir: false,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/app-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: ({ name }) => name?.endsWith('.css')
          ? 'assets/styles/[name]-[hash][extname]'
          : 'assets/media/[name]-[hash][extname]',
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-router-dom')) return 'react';
          if (id.includes('node_modules/three') || id.includes('@react-three')) return 'three';
        },
      },
    },
  },
});

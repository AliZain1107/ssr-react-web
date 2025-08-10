import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    ssr: './src/entry-server.tsx',
    outDir: 'dist/server',
    emptyOutDir: false
  }
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  root: __dirname,
  build: {
    outDir: '../../dist/apps/kitchen-screen',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@bake-app/shared-types': resolve(__dirname, '../../libs/shared-types/src/index.ts'),
      '@bake-app/react/auth': resolve(__dirname, '../../libs/react/auth/src/index.ts'),
      '@bake-app/react/api-client': resolve(__dirname, '../../libs/react/api-client/src/index.ts'),
      '@bake-app/react/store': resolve(__dirname, '../../libs/react/store/src/index.ts'),
      '@bake-app/react/ui': resolve(__dirname, '../../libs/react/ui/src/index.ts'),
      '@bake-app/react/customer-auth': resolve(__dirname, '../../libs/react/customer-auth/src/index.ts'),
    },
  },
  server: {
    port: 4202,
    proxy: {
      '/api': {
        target: process.env['API_URL'] || 'https://api.bake.ilia.to',
        changeOrigin: true,
      },
      '/socket.io': {
        target: process.env['API_URL'] || 'https://api.bake.ilia.to',
        ws: true,
      },
    },
  },
});

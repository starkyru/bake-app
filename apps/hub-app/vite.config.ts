import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 4204,
    proxy: {
      '/api': {
        target: process.env.API_URL || 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@bake-app/shared-types': path.resolve(__dirname, '../../libs/shared-types/src/index.ts'),
      '@bake-app/react/auth': path.resolve(__dirname, '../../libs/react/auth/src/index.ts'),
      '@bake-app/react/api-client': path.resolve(
        __dirname,
        '../../libs/react/api-client/src/index.ts',
      ),
      '@bake-app/react/store': path.resolve(__dirname, '../../libs/react/store/src/index.ts'),
      '@bake-app/react/ui': path.resolve(__dirname, '../../libs/react/ui/src/index.ts'),
    },
  },
});

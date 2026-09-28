import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const BACKEND_TARGET = 'http://5.129.238.27:8000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: BACKEND_TARGET,
        changeOrigin: true,
      },
      '/health': {
        target: BACKEND_TARGET,
        changeOrigin: true,
      },
      '/trips': {
        target: BACKEND_TARGET,
        changeOrigin: true,
      },
      '/sources': {
        target: BACKEND_TARGET,
        changeOrigin: true,
      },
      '/subscriptions': {
        target: BACKEND_TARGET,
        changeOrigin: true,
      },
      '/admin': {
        target: BACKEND_TARGET,
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          antd: ['antd', '@ant-design/icons'],
        },
      },
    },
  },
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// VayuMetricz — dev/preview servers bind to all interfaces for the hosted preview.
export default defineConfig({
  plugins: [react()],
  server: { host: true, port: 3000 },
  preview: { host: true, port: 3000 },
  build: {
    // Split the heavy charting and mapping libraries into their own chunks so the
    // first paint only ships React and the dashboard shell.
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          maps: ['leaflet', 'react-leaflet'],
        },
      },
    },
  },
});

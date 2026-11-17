import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// VayuMetricz — dev/preview servers bind to all interfaces for the hosted preview.
export default defineConfig({
  plugins: [react()],
  server: { host: true, port: 3000 },
  preview: { host: true, port: 3000 },
});

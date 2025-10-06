import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true, // Permite conexiones externas
    strictPort: true, // Falla si el puerto no está disponible en lugar de cambiar automáticamente
    open: false, // Don't auto-open browser (causes issues in CI/CD environments)
  },
});

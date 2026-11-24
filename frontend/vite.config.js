import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const BACKEND_URL = 'http://localhost:3000';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Gọi /api/... và /s/... từ frontend sẽ được chuyển sang backend, khỏi lo CORS khi dev
    proxy: {
      '/api': BACKEND_URL,
      '/s': BACKEND_URL,
    },
  },
});

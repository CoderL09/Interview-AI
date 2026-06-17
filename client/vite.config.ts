import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/send-code': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/register': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/pass-login': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/send-login-code': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/code-login': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/questions': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/logout': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/sessions': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})

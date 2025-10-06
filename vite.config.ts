import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    hmr: {
      overlay: false,
      port: 24679
    },
    // Proxy removed - environment variables handle backend URLs in production
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  define: {
    // Environment variables for local development
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify('http://localhost:3001/api'),
    'import.meta.env.VITE_WEBSOCKET_URL': JSON.stringify('http://localhost:3001'),
    'import.meta.env.VITE_WS_URL': JSON.stringify('http://localhost:3001'),
    'import.meta.env.VITE_API_TIMEOUT': JSON.stringify('30000'),
    'import.meta.env.VITE_ENABLE_DEBUG_LOGGING': JSON.stringify('true')
  }
})

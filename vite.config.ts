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
  }
})

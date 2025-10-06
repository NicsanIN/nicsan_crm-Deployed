import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
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
      // Environment variables - use actual env vars in production, fallback to localhost for development
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL || 'http://localhost:3001/api'),
      'import.meta.env.VITE_WEBSOCKET_URL': JSON.stringify(env.VITE_WEBSOCKET_URL || 'http://localhost:3001'),
      'import.meta.env.VITE_WS_URL': JSON.stringify(env.VITE_WS_URL || 'http://localhost:3001'),
      'import.meta.env.VITE_API_TIMEOUT': JSON.stringify(env.VITE_API_TIMEOUT || '30000'),
      'import.meta.env.VITE_ENABLE_DEBUG_LOGGING': JSON.stringify(env.VITE_ENABLE_DEBUG_LOGGING || 'true')
    }
  }
})

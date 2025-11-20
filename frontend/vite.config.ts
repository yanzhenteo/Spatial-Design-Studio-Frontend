import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss() 
  ],
  server: {
    proxy: {
      // This rule tells the dev server to forward any request that starts with '/api'
      // to your backend server running on port 8000.
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true, // This is recommended to avoid CORS issues
      },
      // Proxy for the speech-to-text microservice
      '/microservice': {
        target: 'http://127.0.0.1:8002',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/microservice/, ''),
      },
    },
  },
})
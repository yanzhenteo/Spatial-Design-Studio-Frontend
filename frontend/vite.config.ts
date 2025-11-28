import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import dotenv from 'dotenv'

// Load environment variables from root .env
const rootDir = path.resolve(__dirname, '../../')
dotenv.config({ path: path.join(rootDir, '.env') })

// Get LAN IP from environment or use defaults
const LAN_IP = process.env.LAN_IP || '192.168.1.1'

// IMPORTANT: Use localhost for proxying since services are on same machine
// Services bind to 0.0.0.0 which makes them accessible from:
//   - localhost (when Vite proxies from same machine)
//   - LAN IP (when phone accesses directly - though phone accesses via Vite proxy)
const PROXY_IP = 'localhost'

// Determine HMR host based on access method
// For localhost: use localhost, for network: use LAN_IP
// This allows both local and mobile access to work with hot reload
let hmrConfig = {}
// If accessed from LAN IP, HMR will work via LAN IP
// The browser will auto-detect and use the correct host
if (process.env.VITE_HMR_HOST) {
  hmrConfig = { host: process.env.VITE_HMR_HOST }
}

export default defineConfig({
  // Tell Vite to look for .env files in the main repo root
  envDir: path.resolve(__dirname, '../../'),
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    // Expose dev server to network (so mobile can connect via LAN IP)
    host: '0.0.0.0',
    // Explicitly set the origin for HMR (Hot Module Replacement)
    // This tells the browser where to connect back to for hot updates
    middlewareMode: false,
    proxy: {
      // This rule tells the dev server to forward any request that starts with '/api'
      // to your backend server running on port 8000.
      '/api': {
        target: `http://${PROXY_IP}:8000`,
        changeOrigin: true, // This is recommended to avoid CORS issues
      },
      // Proxy for speech services (routes to port 8003 - verbose service)
      '/microservice/speech-to-text': {
        target: `http://${PROXY_IP}:8003`,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/microservice/, ''),
      },
      '/microservice/text-to-speech': {
        target: `http://${PROXY_IP}:8003`,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/microservice/, ''),
      },
      '/microservice/download-audio': {
        target: `http://${PROXY_IP}:8003`,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/microservice/, ''),
      },
      '/microservice/download-transcript': {
        target: `http://${PROXY_IP}:8003`,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/microservice/, ''),
      },
      // Proxy for image transform (routes to port 8002 - image service)
      '/microservice': {
        target: `http://${PROXY_IP}:8002`,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/microservice/, ''),
      },
      // Proxy for RAG-Langchain image analysis service
      '/rag-api': {
        target: `http://${PROXY_IP}:8001`,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/rag-api/, ''),
      },
      // Proxy for Picture Generation service (image transformation)
      '/image-gen-api': {
        target: `http://${PROXY_IP}:8002`,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/image-gen-api/, ''),
      },
      // Proxy for Detection service (bounding box identification)
      '/detection-api': {
        target: `http://${PROXY_IP}:8004`,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/detection-api/, ''),
      },
      // Proxy for Product Search service (intelligent product search)
      '/product-search-api': {
        target: `http://${PROXY_IP}:8005`,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/product-search-api/, ''),
      },
      // WebSocket proxy for verbose service
      '/ws-verbose': {
        target: `ws://${PROXY_IP}:8003`,
        ws: true, // Enable WebSocket proxying
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ws-verbose/, '/ws'),
      },
    },
  },
})
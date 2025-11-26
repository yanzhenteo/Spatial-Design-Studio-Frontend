import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  // Tell Vite to look for .env files in the main repo root
  envDir: path.resolve(__dirname, '../../'),
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
      // Proxy for speech services (routes to port 8003 - verbose service)
      '/microservice/speech-to-text': {
        target: 'http://127.0.0.1:8003',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/microservice/, ''),
      },
      '/microservice/text-to-speech': {
        target: 'http://127.0.0.1:8003',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/microservice/, ''),
      },
      '/microservice/download-audio': {
        target: 'http://127.0.0.1:8003',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/microservice/, ''),
      },
      '/microservice/download-transcript': {
        target: 'http://127.0.0.1:8003',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/microservice/, ''),
      },
      // Proxy for image transform (routes to port 8002 - image service)
      '/microservice': {
        target: 'http://127.0.0.1:8002',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/microservice/, ''),
      },
      // Proxy for RAG-Langchain image analysis service
      '/rag-api': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/rag-api/, ''),
      },
      // Proxy for Picture Generation service (image transformation)
      '/image-gen-api': {
        target: 'http://127.0.0.1:8002',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/image-gen-api/, ''),
      },
      // Proxy for Detection service (bounding box identification)
      '/detection-api': {
        target: 'http://127.0.0.1:8004',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/detection-api/, ''),
      },
      // Proxy for Product Search service (intelligent product search)
      '/product-search-api': {
        target: 'http://127.0.0.1:8005',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/product-search-api/, ''),
      },
      // WebSocket proxy for verbose service
      '/ws-verbose': {
        target: 'ws://127.0.0.1:8003',
        ws: true, // Enable WebSocket proxying
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ws-verbose/, '/ws'),
      },
    },
  },
})
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://batchmate-backend.onrender.com',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://batchmate-backend.onrender.com',
        changeOrigin: true,
        ws: true,       // Enable WebSocket proxying for Socket.io
      },
    },
  },
})

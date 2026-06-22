import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const apiTarget = process.env.VITE_API_TARGET || 'http://localhost:40008'

const proxy = {
  '/api': {
    target: apiTarget,
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, '')
  }
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 40007,
    proxy
  },
  preview: {
    host: true,
    port: 40007,
    allowedHosts: true,
    proxy
  }
})

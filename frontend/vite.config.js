import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const apiTarget = process.env.VITE_API_TARGET || 'http://127.0.0.1:40008'

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
    host: '0.0.0.0',
    port: 40007,
    proxy
  },
  preview: {
    host: '0.0.0.0',
    port: 40007,
    allowedHosts: true,
    proxy
  }
})

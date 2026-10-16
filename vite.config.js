import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api-duitku': {
        target: 'https://sandbox.duitku.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api-duitku/, '')
      }
    }
  }
})
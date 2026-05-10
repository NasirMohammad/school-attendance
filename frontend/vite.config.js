import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: "./",
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://attendance.local:31102',
        changeOrigin: true,
      }
    }
  }
})
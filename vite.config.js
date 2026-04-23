import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Proxy Google Maps Directions API to bypass CORS
      '/api/directions': {
        target: 'https://maps.googleapis.com/maps/api/directions/json',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/directions/, ''),
        secure: true,
      },
    },
  },
})

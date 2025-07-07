import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'
import mkcert from 'vite-plugin-mkcert'

export default defineConfig({
  plugins: [react(), mkcert()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    css: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    proxy: {
      // Κάθε request που ξεκινά με /api...
      '/api': {
        // ...θα προωθείται σε αυτή τη διεύθυνση.
        target: 'https://localhost:8443',
        changeOrigin: true,
        // Σημαντικό: Αυτό λέει στο proxy να αγνοήσει τα λάθη
        // που προκύπτουν από self-signed SSL certificates.
        secure: false,
      },
      // Το ίδιο και για τη σύνδεση WebSocket
      '/ws-ais': {
        target: 'https://localhost:8443',
        ws: true, // Ενεργοποίηση του proxy για WebSockets
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'
// import mkcert from 'vite-plugin-mkcert'

export default defineConfig({
  plugins: [react()],
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
  // server: {
  //   proxy: {
  //     '/ws-ais': {
  //       target: 'https://localhost:8443',
  //       ws: true,
  //       changeOrigin: true,
  //     },
  //     '/api/zone/mine': {
  //       target: 'https://localhost:8443',
  //       changeOrigin: true,
  //     },
  //     '/api/auth/login': {
  //       target: 'https://localhost:8443',
  //       changeOrigin: true,
  //     },
  //     '/api/auth/register': {
  //       target: 'https://localhost:8443',
  //       changeOrigin: true,
  //     },
  //   },
  // },
})
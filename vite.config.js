import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Hapus konfigurasi server untuk production build
  // server: {
  //   proxy: {
  //     '/api': {
  //       target: 'http://localhost:80',
  //       changeOrigin: true,
  //       secure: false,
  //     }
  //   }
  // }
})

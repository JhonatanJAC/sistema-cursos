import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['lucide-react'],
          state: ['zustand'],
        },
      },
    },
  },
  server: {
    port: 5173,
    watch: {
      ignored: ['**/release/**', '**/dist/**', '**/dist-electron/**', '**/.git/**'],
    },
  },
})

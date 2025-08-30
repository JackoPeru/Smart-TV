import { defineConfig } from 'electron-vite'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    build: {
      rollupOptions: {
        input: resolve(__dirname, 'electron/main.ts'),
        external: ['bufferutil', 'utf-8-validate']
      }
    }
  },
  preload: {
    build: { rollupOptions: { input: resolve(__dirname, 'electron/preload.ts') } }
  },
  renderer: {
    root: '.',
    plugins: [react()],
    build: { 
      rollupOptions: { 
        input: resolve(__dirname, 'index.html') 
      } 
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    }
  }
})
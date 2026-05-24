import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  root: '.',
  resolve: {
    alias: [
      { find: '@microsoft/power-apps/app', replacement: path.resolve(__dirname, 'apps/help-desk/src/shims/microsoft-power-apps-app.ts') },
      { find: './lib', replacement: path.resolve(__dirname, 'apps/help-desk/src/components/lib') },
      { find: './generated', replacement: path.resolve(__dirname, 'apps/help-desk/src/components/generated') },
      { find: './hooks', replacement: path.resolve(__dirname, 'apps/help-desk/src/components/hooks') },
      { find: '@', replacement: path.resolve(__dirname, 'apps/help-desk/src') },
    ],
  },
  server: {
    hmr: {
      overlay: false
    }
  }
})
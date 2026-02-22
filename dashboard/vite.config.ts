import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    port: 5167,
    strictPort: true, // fail if 5167 is in use so you can free it (lsof -i :5167; kill <PID>)
  },
})

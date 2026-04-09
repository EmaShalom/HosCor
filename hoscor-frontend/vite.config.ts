import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import http from 'http'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        // Disable keep-alive so Vite never reuses a TCP connection that
        // Tomcat has already closed — prevents "socket hang up" ECONNRESET.
        agent: new http.Agent({ keepAlive: false }),
      },
    },
  },
})

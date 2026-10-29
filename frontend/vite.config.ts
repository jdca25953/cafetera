import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './', // rutas relativas: funciona bajo https://usuario.github.io/repositorio/
  plugins: [react()],
  server: { port: 5173 }, // el backend permite este origen por defecto (CORS_ORIGIN)
})

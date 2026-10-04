import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Vercel의 루트 경로에 배포한다. 하위 경로 배포 시 base도 함께 바꿔야 한다.
export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
// base는 빌드(=GitHub Pages 배포)할 때만 저장소 경로를 붙인다 — dev 서버에서도
// 이 경로가 붙으면 localhost:5173/teacher 같은 익숙한 로컬 주소가 깨진다.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/who-am-i-rebuild/' : '/',
  plugins: [react(), tailwindcss()],
}))

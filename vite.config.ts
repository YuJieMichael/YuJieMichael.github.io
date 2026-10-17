import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages 项目站点挂在 /<仓库名>/ 下，由部署工作流通过 BASE_PATH 传入
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
})

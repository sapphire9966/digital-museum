import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    // 支持 history 模式路由
    proxy: {
      // 后端接口代理，避免 CORS
      '/model': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      // Django/后端 media 静态文件代理，避免 glb 加载跨域
      '/media': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
})
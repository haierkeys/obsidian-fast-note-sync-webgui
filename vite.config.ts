import { visualizer } from "rollup-plugin-visualizer";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import path from "path";


export default defineConfig({
  plugins: [
    react(),
    // 构建分析工具 - 生成 stats.html 查看各依赖体积
    visualizer({
      open: false,
      gzipSize: true,
      brotliSize: true,
      filename: "dist/stats.html",
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    minify: 'terser', // 使用 Terser 压缩
    terserOptions: {
      compress: {
        drop_console: true,  // 去除 console.log
      },
    },
    chunkSizeWarningLimit: 1000, // 降低警告阈值到 1MB
    rollupOptions: {
      output: {
        // 代码分割策略
        manualChunks: {
          // React 核心库
          'vendor-react': ['react', 'react-dom', 'react-hook-form'],

          // UI 组件库
          'vendor-ui': [
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-dialog',
            '@radix-ui/react-label',
            '@radix-ui/react-select',
            '@radix-ui/react-slot',
            '@radix-ui/react-tabs',
            '@headlessui/react',
          ],

          // Markdown 编辑器 (体积较大,单独分割)
          'vendor-editor': ['@uiw/react-md-editor'],

          // 图标库
          'vendor-icons': ['lucide-react', 'react-icons'],

          // 工具库
          'vendor-utils': [
            'clsx',
            'tailwind-merge',
            'class-variance-authority',
            'date-fns',
            'zod',
            '@hookform/resolvers',
          ],

          // 国际化
          'vendor-i18n': ['i18next', 'react-i18next'],
        },
        // 为每个 chunk 生成更短的文件名
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
})

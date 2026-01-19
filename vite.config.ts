import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import path from "path";


export default defineConfig({
  plugins: [
    react(),
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
    chunkSizeWarningLimit: 1500, // 降低警告阈值到 1MB
    rollupOptions: {
      output: {
        // 代码分块策略 - 简化版以避免循环依赖
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // 仅将最大的 Vditor 编辑器库独立拆分
            if (id.includes('vditor')) {
              return 'vendor-editor';
            }
            // 其余第三方库合并为 vendor 块，确保 React 等核心库初始化顺序正确
            return 'vendor';
          }
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
})

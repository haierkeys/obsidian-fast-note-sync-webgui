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
    chunkSizeWarningLimit: 1500, // 降低警告阈值到 1MB
    rollupOptions: {
      output: {
        // 代码分割策略 - 使用函数形式更灵活地处理依赖
        manualChunks(id) {
          // React 核心库 + 依赖 React context 的库
          if (id.includes('node_modules/react/') || 
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/scheduler/') ||
              id.includes('node_modules/react-i18next/')) {
            return 'vendor-react';
          }
          
          // React Hook Form
          if (id.includes('node_modules/react-hook-form/') ||
              id.includes('node_modules/@hookform/')) {
            return 'vendor-form';
          }

          // ProseMirror 编辑器引擎
          if (id.includes('node_modules/prosemirror-') ||
              id.includes('node_modules/@prosemirror-adapter/')) {
            return 'vendor-prosemirror';
          }

          // CodeMirror 核心
          if (id.includes('node_modules/@codemirror/state') ||
              id.includes('node_modules/@codemirror/view')) {
            return 'vendor-cm-core';
          }

          // CodeMirror 语言支持
          if (id.includes('node_modules/@codemirror/lang-')) {
            return 'vendor-cm-langs';
          }

          // CodeMirror 其他模块
          if (id.includes('node_modules/@codemirror/')) {
            return 'vendor-cm-ext';
          }

          // Lezer 解析器
          if (id.includes('node_modules/@lezer/')) {
            return 'vendor-lezer';
          }

          // MDXEditor 编辑器
          if (id.includes('node_modules/@mdxeditor/')) {
            return 'vendor-mdxeditor';
          }

          // Radix UI 组件库
          if (id.includes('node_modules/@radix-ui/')) {
            return 'vendor-radix';
          }

          // Headless UI
          if (id.includes('node_modules/@headlessui/')) {
            return 'vendor-headless';
          }

          // 图标库
          if (id.includes('node_modules/lucide-react/') ||
              id.includes('node_modules/react-icons/')) {
            return 'vendor-icons';
          }

          // 国际化 (i18next 核心，react-i18next 已合并到 vendor-react)
          if (id.includes('node_modules/i18next')) {
            return 'vendor-i18n';
          }

          // 动画库
          if (id.includes('node_modules/motion/') ||
              id.includes('node_modules/framer-motion/')) {
            return 'vendor-motion';
          }

          // 状态管理
          if (id.includes('node_modules/zustand/')) {
            return 'vendor-state';
          }

          // 工具库
          if (id.includes('node_modules/clsx/') ||
              id.includes('node_modules/tailwind-merge/') ||
              id.includes('node_modules/class-variance-authority/') ||
              id.includes('node_modules/date-fns/') ||
              id.includes('node_modules/zod/')) {
            return 'vendor-utils';
          }

          // remark/unified markdown 处理
          if (id.includes('node_modules/remark-') ||
              id.includes('node_modules/unified') ||
              id.includes('node_modules/mdast-') ||
              id.includes('node_modules/micromark') ||
              id.includes('node_modules/unist-')) {
            return 'vendor-markdown';
          }

          // KaTeX 数学公式
          if (id.includes('node_modules/katex/')) {
            return 'vendor-katex';
          }
        },
        // 为每个 chunk 生成更短的文件名
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
})

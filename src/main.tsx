import "@/i18n/translations";
import "@/app/globals.css";

import { ConfirmDialogProvider } from "@/components/context/confirm-dialog-context";
import { ThemeProvider } from "@/components/context/theme-context";
import { Toaster } from "@/components/ui/sonner";
import ReactDOM from "react-dom/client";
import React from "react";

import { AuthProvider } from "./components/context/auth-context";
import App from "./App";


// 初始化配色方案
const initColorScheme = () => {
  const stored = localStorage.getItem('app-settings')
  if (stored) {
    try {
      const { state } = JSON.parse(stored)
      if (state?.colorScheme) {
        document.documentElement.setAttribute('data-color-scheme', state.colorScheme)
      }
    } catch {
      // 忽略解析错误
    }
  }
}
initColorScheme()

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="auto">
      <AuthProvider>
        <ConfirmDialogProvider>
          <App />
          <Toaster />
        </ConfirmDialogProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
)

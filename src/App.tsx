import { useVaultHandle } from "@/components/api-handle/vault-handle";
import { SystemSettings } from "@/components/layout/system-settings";
import { useUserHandle } from "@/components/api-handle/user-handle";
import { NoteManager } from "@/components/note/note-manager";
import { FileManager } from "@/components/file/file-manager";
import { useAuth } from "@/components/context/auth-context";
import { ComingSoon } from "@/components/common/ComingSoon";
import { VaultList } from "@/components/vault/vault-list";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthForm } from "@/components/user/auth-form";
import { useUrlSync } from "@/hooks/use-url-sync";
import { toast } from "@/components/common/Toast";
import { useAppStore } from "@/stores/app-store";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import env from "@/env.ts";


/**
 * App - 应用主组件
 *
 * 使用新的 AppLayout 布局组件，保持原有功能：
 * - 认证逻辑
 * - 模块渲染
 * - 管理员权限检查
 * - Zen 模式支持
 *
 * Requirements: 1.5, 10.1, 10.2, 10.3, 10.4, 10.5, 10.7
 */
function App() {
  const { t } = useTranslation()
  const { isLoggedIn, login, logout } = useAuth()
  const { handleVaultList } = useVaultHandle()
  const { handleUserInfo } = useUserHandle()

  // 使用 Zustand store 管理应用状态
  const { currentModule, setModule, zenMode, setZenMode, resetState, trashType } = useAppStore()

  // 本地状态
  const [activeVault, setActiveVault] = useState<string | null>(null)

  // URL 同步 Hooks
  useUrlSync(activeVault, setActiveVault)

  const [vaultsLoaded, setVaultsLoaded] = useState(false)
  const [registerIsEnable, setRegisterIsEnable] = useState(true)
  const [adminUid, setAdminUid] = useState<number | null>(null)
  const [configLoaded, setConfigLoaded] = useState(false)

  // 计算当前用户是否为管理员
  const currentUid = localStorage.getItem("uid") ? parseInt(localStorage.getItem("uid")!) : null
  const isAdmin = adminUid !== null && currentUid !== null && (adminUid === 0 || adminUid === currentUid)

  // 验证用户登录状态
  useEffect(() => {
    if (isLoggedIn) {
      handleUserInfo(logout)
    }
  }, [isLoggedIn, handleUserInfo, logout])

  // 当切换到笔记、附件或回收站页面时，从 API 获取仓库列表并验证当前仓库是否有效
  useEffect(() => {
    if ((currentModule === "notes" || currentModule === "files" || currentModule === "trash") && isLoggedIn) {
      setVaultsLoaded(false)
      handleVaultList((vaults) => {
        if (vaults.length > 0) {
          // 检查当前 activeVault 是否存在于仓库列表中
          const vaultExists = activeVault && vaults.some(v => v.vault === activeVault)

          // 如果不存在或未设置，则设置为第一个仓库
          if (!vaultExists) {
            setActiveVault(vaults[0].vault)
          }
          setVaultsLoaded(true)
        } else {
          // 如果没有笔记库，提示用户并返回仓库列表
          toast.warning(t("pleaseCreateVault"))
          setModule("vaults")
          setVaultsLoaded(true)
        }
      })
    }
  }, [currentModule, isLoggedIn, handleVaultList, activeVault, t, setModule])

  // 动态加载字体和配置
  useEffect(() => {
    let isMounted = true
    let currentFontUrl = ""

    const updateFonts = (fontUrl: string) => {
      if (currentFontUrl === fontUrl) return
      currentFontUrl = fontUrl

      // 移除旧的动态样式
      const oldLink = document.getElementById("dynamic-font-link")
      if (oldLink) oldLink.remove()
      const oldStyle = document.getElementById("dynamic-font-style")
      if (oldStyle) oldStyle.remove()
      document.body.style.fontFamily = ""

      if (!fontUrl) return

      // 1. 处理简写: "local" -> "/static/fonts/local.css"
      let finalUrl = fontUrl
      if (!fontUrl.includes("/") && !fontUrl.includes("://")) {
        finalUrl = `/static/fonts/${fontUrl}.css`
      }

      // 2. 格式化完整路径 (不再强制拼接 API 地址，由浏览器基于当前域名解析)
      const fullUrl = finalUrl

      // 提取路径部分用于判断扩展名 (忽略查询参数)
      const pathOnly = finalUrl.split('?')[0].split('#')[0]
      const isCss = pathOnly.toLowerCase().endsWith(".css") || finalUrl.includes("fonts.googleapis.com")
      const isDirectFont = /\.(woff2|woff|ttf|otf)$/i.test(pathOnly)

      if (isCss) {
        // 加载 CSS 链接
        const link = document.createElement("link")
        link.id = "dynamic-font-link"
        link.rel = "stylesheet"
        link.href = fullUrl
        link.crossOrigin = "anonymous"
        document.head.appendChild(link)

        // 针对 Google Fonts 自动尝试应用
        if (fullUrl.includes("fonts.googleapis.com")) {
          const familyMatch = fullUrl.match(/family=([^&:]+)/)
          if (familyMatch) {
            const familyName = decodeURIComponent(familyMatch[1]).replace(/\+/g, ' ')
            document.body.style.fontFamily = `'${familyName}', sans-serif`
          }
        }
      } else if (isDirectFont) {
        // 直接定义字体并应用
        const style = document.createElement("style")
        style.id = "dynamic-font-style"
        const familyName = "DynamicCustomFont"
        style.textContent = `
          @font-face {
            font-family: '${familyName}';
            src: url('${fullUrl}');
            font-weight: normal;
            font-style: normal;
            font-display: swap;
          }
          body { font-family: '${familyName}', sans-serif !important; }
        `
        document.head.appendChild(style)
      }
    }

    const fetchConfig = async () => {
      try {
        const apiUrl = env.API_URL.endsWith("/") ? env.API_URL.slice(0, -1) : env.API_URL
        const response = await fetch(`${apiUrl}/api/webgui/config`)
        if (response.ok && isMounted) {
          const res = await response.json()
          if (res.code > 0 && res.data) {
            updateFonts(res.data.fontSet || res.data.FontSet || "")
            if (res.data.registerIsEnable !== undefined) {
              setRegisterIsEnable(res.data.registerIsEnable)
            }
            if (res.data.adminUid !== undefined) {
              setAdminUid(res.data.adminUid)
            }
          }
        }
      } finally {
        if (isMounted) {
          setConfigLoaded(true)
        }
      }
    }

    fetchConfig()

    return () => {
      isMounted = false
    }
  }, [t])

  // 处理认证成功
  const handleAuthSuccess = () => {
    login()
  }

  // 处理登出
  const handleLogout = () => {
    // 清除认证状态
    logout()
    // 重置应用状态
    resetState()
  }

  // 处理 Zen 模式切换
  const handleToggleZenMode = () => {
    setZenMode(!zenMode)
  }

  // 未登录时显示登录/注册页面
  if (!isLoggedIn) {
    return (
      <div className="w-full min-h-screen">
        <AuthForm onSuccess={handleAuthSuccess} registerIsEnable={registerIsEnable} />
      </div>
    )
  }

  // 渲染当前模块内容
  const renderModuleContent = () => {
    switch (currentModule) {
      case "notes":
        // 等待 vault 加载完成
        if (!vaultsLoaded || !activeVault) {
          return (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )
        }
        return (
          <NoteManager
            key="notes"
            vault={activeVault}
            onVaultChange={setActiveVault}
            onNavigateToVaults={() => setModule("vaults")}
            isMaximized={zenMode}
            onToggleMaximize={handleToggleZenMode}
          />
        )

      case "files":
        // 等待 vault 加载完成
        if (!vaultsLoaded || !activeVault) {
          return (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )
        }
        return (
          <FileManager
            vault={activeVault}
            onVaultChange={setActiveVault}
            onNavigateToVaults={() => setModule("vaults")}
          />
        )

      case "trash":
        // 等待 vault 加载完成
        if (!vaultsLoaded || !activeVault) {
          return (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )
        }
        // 根据 trashType 决定显示笔记回收站还是附件回收站
        if (trashType === "files") {
          return (
            <FileManager
              vault={activeVault}
              onVaultChange={setActiveVault}
              onNavigateToVaults={() => setModule("vaults")}
              isRecycle={true}
            />
          )
        }
        return (
          <NoteManager
            key="trash"
            vault={activeVault}
            onVaultChange={setActiveVault}
            onNavigateToVaults={() => setModule("vaults")}
            isMaximized={zenMode}
            onToggleMaximize={handleToggleZenMode}
            isRecycle={true}
          />
        )

      case "settings":
        // 等待配置加载完成
        if (!configLoaded) {
          return (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )
        }
        // 非管理员访问设置页面时显示提示并跳转
        if (!isAdmin) {
          toast.warning(t("onlyAdminAccess"))
          setModule("vaults")
          return null
        }
        return (
          <SystemSettings onBack={() => setModule("vaults")} />
        )

      case "sync":
        return (
          <ComingSoon
            title={t("menuSync") || "远端备份"}
            description={t("syncComingSoon") || "远端备份功能正在开发中，将支持 S3、OSS、WebDAV 等多种存储后端。"}
          />
        )

      case "git":
        return (
          <ComingSoon
            title={t("menuGit") || "Git 自动化"}
            description={t("gitComingSoon") || "Git 自动化功能正在开发中，将支持自动提交、推送和版本管理。"}
          />
        )

      case "vaults":
      default:
        return (
          <VaultList
            onNavigateToNotes={(vaultName) => {
              setActiveVault(vaultName)
              setModule("notes")
            }}
            onNavigateToAttachments={(vaultName) => {
              setActiveVault(vaultName)
              setModule("files")
            }}
          />
        )
    }
  }

  return (
    <AppLayout isAdmin={isAdmin} onLogout={handleLogout}>
      {renderModuleContent()}
    </AppLayout>
  )
}

export default App

import { useVaultHandle } from "@/components/api-handle/vault-handle";
import { useUserHandle } from "@/components/api-handle/user-handle";
import { useState, useEffect, lazy, Suspense } from "react";
import { useAuth } from "@/components/context/auth-context";
import { AppLayout } from "@/components/layout/AppLayout";
import { useUrlSync } from "@/hooks/use-url-sync";
import { toast } from "@/components/common/Toast";
import { useAppStore } from "@/stores/app-store";
import { useTranslation } from "react-i18next";
import env from "@/env.ts";


// 懒加载核心业务模块
const NoteManager = lazy(() => import("@/components/note/note-manager").then(m => ({ default: m.NoteManager })));
const FileManager = lazy(() => import("@/components/file/file-manager").then(m => ({ default: m.FileManager })));
const SystemSettings = lazy(() => import("@/components/layout/system-settings").then(m => ({ default: m.SystemSettings })));
const VaultList = lazy(() => import("@/components/vault/vault-list").then(m => ({ default: m.VaultList })));
const AuthForm = lazy(() => import("@/components/user/auth-form").then(m => ({ default: m.AuthForm })));
const ComingSoon = lazy(() => import("@/components/common/ComingSoon").then(m => ({ default: m.ComingSoon })));

// 加载占位符
const PageLoading = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

function App() {
  const { t } = useTranslation()
  const { isLoggedIn, login, logout } = useAuth()
  const { handleVaultList } = useVaultHandle()
  const { handleUserInfo } = useUserHandle()

  const { currentModule, setModule, zenMode, setZenMode, resetState, trashType } = useAppStore()

  const [activeVault, setActiveVault] = useState<string | null>(null)

  useUrlSync(activeVault, setActiveVault)

  const [vaultsLoaded, setVaultsLoaded] = useState(false)
  const [registerIsEnable, setRegisterIsEnable] = useState(true)
  const [adminUid, setAdminUid] = useState<number | null>(null)
  const [configLoaded, setConfigLoaded] = useState(false)

  const currentUid = localStorage.getItem("uid") ? parseInt(localStorage.getItem("uid")!) : null
  const isAdmin = adminUid !== null && currentUid !== null && (adminUid === 0 || adminUid === currentUid)

  useEffect(() => {
    if (isLoggedIn) {
      handleUserInfo(logout)
    }
  }, [isLoggedIn, handleUserInfo, logout])

  useEffect(() => {
    if ((currentModule === "notes" || currentModule === "files" || currentModule === "trash") && isLoggedIn) {
      setVaultsLoaded(false)
      handleVaultList((vaults) => {
        if (vaults.length > 0) {
          const vaultExists = activeVault && vaults.some(v => v.vault === activeVault)
          if (!vaultExists) {
            setActiveVault(vaults[0].vault)
          }
          setVaultsLoaded(true)
        } else {
          toast.warning(t("pleaseCreateVault"))
          setModule("vaults")
          setVaultsLoaded(true)
        }
      })
    }
  }, [currentModule, isLoggedIn, handleVaultList, t, setModule, activeVault])

  useEffect(() => {
    let isMounted = true
    let currentFontUrl = ""

    const updateFonts = (fontUrl: string) => {
      if (currentFontUrl === fontUrl) return
      currentFontUrl = fontUrl

      const oldLink = document.getElementById("dynamic-font-link")
      if (oldLink) oldLink.remove()
      const oldStyle = document.getElementById("dynamic-font-style")
      if (oldStyle) oldStyle.remove()
      document.body.style.fontFamily = ""

      if (!fontUrl) return

      let finalUrl = fontUrl
      if (!fontUrl.includes("/") && !fontUrl.includes("://")) {
        finalUrl = `/static/fonts/${fontUrl}.css`
      }

      const fullUrl = finalUrl
      const pathOnly = finalUrl.split('?')[0].split('#')[0]
      const isCss = pathOnly.toLowerCase().endsWith(".css") || finalUrl.includes("fonts.googleapis.com")
      const isDirectFont = /\.(woff2|woff|ttf|otf)$/i.test(pathOnly)

      if (isCss) {
        const link = document.createElement("link")
        link.id = "dynamic-font-link"
        link.rel = "stylesheet"
        link.href = fullUrl
        link.crossOrigin = "anonymous"
        document.head.appendChild(link)

        if (fullUrl.includes("fonts.googleapis.com")) {
          const familyMatch = fullUrl.match(/family=([^&:]+)/)
          if (familyMatch) {
            const familyName = decodeURIComponent(familyMatch[1]).replace(/\+/g, ' ')
            document.body.style.fontFamily = `'${familyName}', sans-serif`
          }
        }
      } else if (isDirectFont) {
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

  const handleAuthSuccess = () => {
    login()
  }

  const handleLogout = () => {
    logout()
    resetState()
  }

  const handleToggleZenMode = () => {
    setZenMode(!zenMode)
  }

  if (!isLoggedIn) {
    return (
      <div className="w-full min-h-screen">
        <Suspense fallback={<PageLoading />}>
          <AuthForm onSuccess={handleAuthSuccess} registerIsEnable={registerIsEnable} />
        </Suspense>
      </div>
    )
  }

  const renderModuleContent = () => {
    switch (currentModule) {
      case "notes":
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
        if (!vaultsLoaded || !activeVault) {
          return (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )
        }
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
        if (!configLoaded) {
          return (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )
        }
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
      <Suspense fallback={<PageLoading />}>
        {renderModuleContent()}
      </Suspense>
    </AppLayout>
  )
}

export default App

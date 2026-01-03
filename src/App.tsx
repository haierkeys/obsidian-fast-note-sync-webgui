import { LogOut, Menu, X, Clipboard, Database, FileText, RefreshCw, GitBranch, Settings, Trash2 } from "lucide-react";
import { useConfirmDialog } from "@/components/context/confirm-dialog-context";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { ChangePassword } from "@/components/user/change-password";
import { RegisterForm } from "@/components/user/register-form";
import { NoteManager } from "@/components/note/note-manager";
import { VaultList } from "@/components/vault/vault-list";
import { LoginForm } from "@/components/user/login-form";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import env from "@/env.ts";

import { useVaultHandle } from "./components/api-handle/vault-handle";
import { useUserHandle } from "./components/api-handle/user-handle";
import { useVersion } from "./components/api-handle/use-version";
import { useAuth } from "./components/context/auth-context";


function App() {
  const { t } = useTranslation()
  const { isLoggedIn, login, logout } = useAuth()
  const { versionInfo } = useVersion()
  const { handleVaultList } = useVaultHandle()
  const { handleUserInfo } = useUserHandle()

  const [isRegistering, setIsRegistering] = useState(false)
  const [activeMenu, setActiveMenu] = useState("vaults")
  const [activeVault, setActiveVault] = useState("defaultVault")
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  const [registerIsEnable, setRegisterIsEnable] = useState(true)

  // 验证用户登录状态
  useEffect(() => {
    if (isLoggedIn) {
      handleUserInfo(logout)
    }
  }, [isLoggedIn, handleUserInfo, logout])

  // 当切换到笔记页面时,从 API 获取仓库列表并验证当前仓库是否有效
  useEffect(() => {
    if (activeMenu === "notes" && isLoggedIn) {
      handleVaultList((vaults) => {
        if (vaults.length > 0) {
          // 检查当前 activeVault 是否存在于仓库列表中
          const vaultExists = vaults.some(v => v.vault === activeVault)

          // 如果不存在或为默认值,则设置为第一个仓库
          if (!vaultExists || activeVault === "defaultVault") {
            setActiveVault(vaults[0].vault)
          }
        }
      })
    }
  }, [activeMenu, isLoggedIn, handleVaultList, activeVault])

  // 动态加载字体和配置
  useEffect(() => {
    let isMounted = true;
    let currentFontSet = "";

    const fallbackFonts = `"Segoe UI", Segoe, ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"`;

    const updateFonts = (fontSet: string) => {
      if (currentFontSet === fontSet) return;
      currentFontSet = fontSet;

      // 移除旧的注入标签
      const oldStyle = document.getElementById("dynamic-font-style");
      if (oldStyle) oldStyle.remove();
      const oldLink = document.getElementById("dynamic-font-link");
      if (oldLink) oldLink.remove();

      let fontFamily = fallbackFonts;
      let styleContent = "";

      if (fontSet === "local") {
        fontFamily = `"LXGW WenKai Lite", ${fallbackFonts}`;
        styleContent = `
          @font-face {
            font-family: "LXGW WenKai Lite";
            src: url("/fonts/LXGWWenKai-Light.woff") format("woff");
            font-weight: normal;
            font-style: normal;
            font-display: swap;
          }
        `;
      } else if (fontSet && (fontSet.startsWith("http://") || fontSet.startsWith("https://"))) {
        if (fontSet.endsWith(".css")) {
          const link = document.createElement("link");
          link.id = "dynamic-font-link";
          link.rel = "stylesheet";
          link.href = fontSet;
          link.crossOrigin = "anonymous";
          document.head.appendChild(link);
        } else {
          fontFamily = `"CustomFont", ${fallbackFonts}`;
          styleContent = `
            @font-face {
              font-family: "CustomFont";
              src: url("${fontSet}");
              font-weight: normal;
              font-style: normal;
              font-display: swap;
            }
          `;
        }
      }

      // 始终应用通用样式（包含后备字体）
      const style = document.createElement("style");
      style.id = "dynamic-font-style";
      style.innerHTML = `
        ${styleContent}
        body, input, textarea, .w-md-editor, .wmde-markdown {
          font-family: ${fontFamily} !important;
        }
      `;
      document.head.appendChild(style);
    };

    const fetchConfig = async () => {
      try {
        const apiUrl = env.API_URL.endsWith("/") ? env.API_URL.slice(0, -1) : env.API_URL;
        const response = await fetch(`${apiUrl}/api/webgui/config`);
        if (response.ok && isMounted) {
          const res = await response.json();
          if (res.code > 0 && res.data) {
            updateFonts(res.data.fontSet || res.data.FontSet || "");
            if (res.data.registerIsEnable !== undefined) {
              setRegisterIsEnable(res.data.registerIsEnable);
            }
          } else {
            updateFonts("");
          }
        } else if (isMounted) {
          updateFonts("");
        }
      } catch (error) {
        if (isMounted) {
          console.error("Failed to fetch webgui config:", error);
          updateFonts("");
        }
      }
    };

    fetchConfig();

    return () => {
      isMounted = false;
    };
  }, [])

  const handleLoginSuccess = () => {
    login()
  }

  const handleRegisterSuccess = () => {
    login()
    setIsRegistering(false)
  }

  const menuItems = [
    { id: "vaults", label: t("menuVaults"), icon: Database },
    { id: "notes", label: t("menuNotes"), icon: FileText },
    { id: "trash", label: t("menuTrash"), icon: Trash2 },
    { id: "sync", label: t("menuSync"), icon: RefreshCw, isPlanned: true },
    { id: "git", label: t("menuGit"), icon: GitBranch, isPlanned: true },
    { id: "settings", label: t("menuSettings"), icon: Settings, isPlanned: true },
  ]

  const { openConfirmDialog } = useConfirmDialog()

  const handleCopyConfig = () => {
    const config = {
      api: env.API_URL,
      apiToken: localStorage.getItem("token")!,
      vault: "defaultVault",
    }

    const configText = JSON.stringify(config, null, 2)

    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(configText)
        .then(() => {
          openConfirmDialog(
            t("copyConfigSuccess"),
            "success",
            undefined,
            <textarea readOnly className="mt-1 block w-full p-2.5 text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 resize-none h-52">
              {configText}
            </textarea>
          )
        })
        .catch((err) => {
          openConfirmDialog(t("error") + err)
        })
    } else {
      openConfirmDialog(
        t("error") + t("copyConfigError"),
        "error",
        undefined,
        <textarea readOnly className="mt-1 block w-full p-2.5 text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 resize-none h-52">
          {configText}
        </textarea>
      )
    }
  }

  return (
    <div className="flex justify-center w-full min-h-screen bg-gray-100">
      <div className={`flex flex-col rounded-lg border text-card-foreground shadow-sm w-full ${isMaximized ? "m-0 rounded-none border-none h-screen" : "max-w-[1400px] m-2 sm:m-4 md:m-10 bg-gray-50 overflow-hidden"}`}>
        {/* Top Navigation Bar */}
        {!isMaximized && (
          <div className="border-b px-3 sm:px-6 py-3 flex items-center justify-between bg-gray-50 rounded-t-lg">
          {/* Logo and Site Name */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Mobile Menu Button */}
            {isLoggedIn && (
              <button onClick={() => setShowMobileSidebar(!showMobileSidebar)} className="md:hidden p-2 hover:bg-gray-100 rounded-md">
                {showMobileSidebar ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            )}
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs sm:text-base">OS</span>
            </div>
            <span className="text-sm sm:text-xl font-semibold">Obsidian Fast Note Sync</span>
          </div>

          {/* User Actions */}
          {isLoggedIn && (
            <div className="flex items-center space-x-2">
              <LanguageSwitcher className="text-gray-600 hover:text-gray-900" />
              <div className="relative">
                <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center space-x-2 hover:bg-gray-100 rounded-full p-2">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 text-xs sm:text-base">U</span>
                  </div>
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 border z-10">
                    <button
                      onClick={() => {
                        setShowChangePassword(true)
                        setShowUserMenu(false)
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      {t("changePassword")}
                    </button>
                    <button
                      onClick={() => {
                        logout()
                        setShowUserMenu(false)
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      {t("logout")}
                      <LogOut className="h-4 w-4 inline-block ml-2" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        )}

        {/* Content Area with Sidebar and Main Content */}
        <div className="flex flex-1 relative overflow-hidden">
          {/* Left Sidebar - Desktop and Mobile */}
          {isLoggedIn && !isMaximized && (
            <>
              {/* Mobile Sidebar Overlay */}
              {showMobileSidebar && <div className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden" onClick={() => setShowMobileSidebar(false)} />}

              {/* Sidebar */}
              <div
                className={`
                  fixed md:relative inset-y-0 left-0 z-20 md:z-0
                  w-48 border-r p-4 bg-gray-50
                  transform transition-transform duration-200 ease-in-out
                  ${showMobileSidebar ? "translate-x-0" : "-translate-x-full"}
                  md:translate-x-0
                `}>
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold mb-4">{t("navigation")}</h2>
                  <nav className="space-y-2">
                    {menuItems.map((item) => (
                      <div key={item.id} className="relative group">
                        <button
                          onClick={() => {
                            if (item.isPlanned) {
                              openConfirmDialog(t("underConstruction"), "info")
                              return
                            }
                            setActiveMenu(item.id)
                            setShowMobileSidebar(false)
                          }}
                          className={`w-full flex items-center px-3 py-2 rounded-md transition-colors whitespace-nowrap ${activeMenu === item.id ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"}`}>
                          <item.icon className="mr-3 h-4 w-4" />
                          {item.label}
                        </button>
                        {item.isPlanned && (
                          <div className="absolute right-0 top-0 pointer-events-none">
                            <span className="px-1 py-0.5 text-[9px] font-medium bg-blue-100 text-blue-600 rounded-bl-md rounded-tr-md border-b border-l border-blue-200 block scale-90 origin-top-right">
                              {t("planned")}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </nav>
                  <div className="mt-4 pt-4 border-t">
                    <button onClick={handleCopyConfig} className="w-full flex items-center justify-center px-3 py-2 text-sm bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
                      <Clipboard className="mr-2 h-4 w-4" />
                      {t("copyConfig")}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Main Content */}
          <div className={`flex-1 ${!isMaximized ? "py-6 sm:py-8 px-2 sm:px-4 md:px-6 lg:px-8" : "p-0"} ${!isLoggedIn ? "w-full" : ""}`}>
            {isLoggedIn ? (
              showChangePassword ? (
                <div className="max-w-md mx-auto bg-white p-4 sm:p-6 rounded-lg shadow-md">
                  <h2 className="text-xl font-bold mb-4">{t("changePassword")}</h2>
                  <ChangePassword close={() => setShowChangePassword(false)} />
                </div>
              ) : activeMenu === "notes" ? (
                <NoteManager
                  key={activeMenu}
                  vault={activeVault}
                  onVaultChange={setActiveVault}
                  onNavigateToVaults={() => setActiveMenu("vaults")}
                  isMaximized={isMaximized}
                  onToggleMaximize={() => setIsMaximized(!isMaximized)}
                />
              ) : activeMenu === "trash" ? (
                <NoteManager
                  key={activeMenu}
                  vault={activeVault}
                  onVaultChange={setActiveVault}
                  onNavigateToVaults={() => setActiveMenu("vaults")}
                  isMaximized={isMaximized}
                  onToggleMaximize={() => setIsMaximized(!isMaximized)}
                  isRecycle={true}
                />
              ) : (
                <VaultList onNavigateToNotes={(vaultName) => {
                  setActiveVault(vaultName);
                  setActiveMenu("notes");
                }} />
              )
            ) : isRegistering ? (
              <RegisterForm onSuccess={handleRegisterSuccess} onBackToLogin={() => setIsRegistering(false)} />
            ) : (
              <LoginForm onSuccess={handleLoginSuccess} onRegister={() => setIsRegistering(true)} registerIsEnable={registerIsEnable} />
            )}
          </div>
        </div>

        {/* Footer */}
        {!isMaximized && (
          <div className="border-t px-4 py-3 bg-gray-50 text-center text-sm text-gray-600 rounded-b-lg">
          <div className="flex flex-col sm:flex-row justify-center items-center gap-2">
            <span>© 2024 Obsidian Fast Note Sync Service</span>
            <span className="hidden sm:inline">•</span>
            <a href="https://github.com/haierkeys/fast-note-sync-service" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline">
              GitHub
            </a>
            {versionInfo && (
              <>
                <span className="hidden sm:inline">•</span>
                <span className="text-gray-500">
                  v{versionInfo.version}
                  {versionInfo.gitTag && ` ( ${versionInfo.gitTag} / ${versionInfo.buildTime} )`}
                </span>
              </>
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  )
}

export default App

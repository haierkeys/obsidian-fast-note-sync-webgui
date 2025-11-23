import { useConfirmDialog } from "@/components/context/confirm-dialog-context";
import { ChangePassword } from "@/components/user/change-password";
import { RegisterForm } from "@/components/user/register-form";
import { NoteManager } from "@/components/note/note-manager";
import { VaultList } from "@/components/vault/vault-list";
import { LogOut, Menu, X, Clipboard } from "lucide-react";
import { LoginForm } from "@/components/user/login-form";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import env from "@/env.ts";

import { useVersion } from "./components/api-handle/use-version";
import { useAuth } from "./components/context/auth-context";


function App() {
  const { t } = useTranslation()
  const { isLoggedIn, login, logout } = useAuth()
  const { versionInfo } = useVersion()

  const [isRegistering, setIsRegistering] = useState(false)
  const [activeMenu, setActiveMenu] = useState("vaults")
  const [activeVault, setActiveVault] = useState("defaultVault")
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)

  const handleLoginSuccess = () => {
    login()
  }

  const handleRegisterSuccess = () => {
    login()
    setIsRegistering(false)
  }

  const menuItems = [
    { id: "vaults", label: t("menuVaults") },
    { id: "notes", label: t("menuNotes") },
    { id: "sync", label: t("menuSync") },
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
      <div className="flex flex-col rounded-lg border text-card-foreground shadow-sm w-full max-w-[1400px] m-2 sm:m-4 md:m-10 bg-gray-50 overflow-hidden">
        {/* Top Navigation Bar */}
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
          )}
        </div>

        {/* Content Area with Sidebar and Main Content */}
        <div className="flex flex-1 relative">
          {/* Left Sidebar - Desktop and Mobile */}
          {isLoggedIn && (
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
                      <button
                        key={item.id}
                        onClick={() => {
                          if (item.id === "sync") {
                            openConfirmDialog(t("underConstruction"), "info")
                            return
                          }
                          setActiveMenu(item.id)
                          setShowMobileSidebar(false)
                        }}
                        className={`w-full text-left px-3 py-2 rounded-md transition-colors whitespace-nowrap ${activeMenu === item.id ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"}`}>
                        {item.label}
                      </button>
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
          <div className={`flex-1 py-6 sm:py-12 px-2 sm:px-4 md:px-6 lg:px-8 ${!isLoggedIn ? "w-full" : ""}`}>
            {isLoggedIn ? (
              showChangePassword ? (
                <div className="max-w-md mx-auto bg-white p-4 sm:p-6 rounded-lg shadow-md">
                  <h2 className="text-xl font-bold mb-4">{t("changePassword")}</h2>
                  <ChangePassword close={() => setShowChangePassword(false)} />
                </div>
              ) : activeMenu === "notes" ? (
                <NoteManager vault={activeVault} onVaultChange={setActiveVault} />
              ) : (
                <VaultList onNavigateToNotes={(vaultName) => {
                  setActiveVault(vaultName);
                  setActiveMenu("notes");
                }} />
              )
            ) : isRegistering ? (
              <RegisterForm onSuccess={handleRegisterSuccess} onBackToLogin={() => setIsRegistering(false)} />
            ) : (
              <LoginForm onSuccess={handleLoginSuccess} onRegister={() => setIsRegistering(true)} />
            )}
          </div>
        </div>

        {/* Footer */}
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
      </div>
    </div>
  )
}

export default App

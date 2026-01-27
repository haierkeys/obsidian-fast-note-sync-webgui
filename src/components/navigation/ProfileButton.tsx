import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Clipboard, LogOut, ExternalLink } from "lucide-react";
import { toast } from "@/components/common/Toast";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import env from "@/env.ts";


interface ProfileButtonProps {
  /** 登出回调 */
  onLogout: () => void
  /** 额外的 CSS 类名 */
  className?: string
}

/**
 * ProfileButton - 用户资料按钮组件
 *
 * 圆形头像按钮，点击展开下拉菜单：
 * - 显示用户 ID
 * - 复制配置
 * - 登出
 */
export function ProfileButton({ onLogout, className }: ProfileButtonProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [configModalOpen, setConfigModalOpen] = useState(false)
  const [configModalIsError, setConfigModalIsError] = useState(false)

  const currentUid = localStorage.getItem("uid")
  const username = localStorage.getItem("username")

  // 获取配置 JSON
  const getConfigJson = useCallback(() => {
    return JSON.stringify({
      api: env.API_URL,
      apiToken: localStorage.getItem("token") || "",
    }, null, 2)
  }, [])

  const getObsidianUrl = useCallback(() => {
    const api = env.API_URL;
    const apiToken = localStorage.getItem("token") || "";
    return `obsidian://fast-note-sync/sso?pushApi=${encodeURIComponent(api)}&pushApiToken=${encodeURIComponent(apiToken)}`;
  }, []);

  // 复制配置到剪贴板
  const handleCopyConfig = () => {
    setConfigModalIsError(false)
    setConfigModalOpen(true)
    setOpen(false)
  }

  // 处理登出
  const handleLogout = () => {
    setOpen(false)
    onLogout()
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "size-9 rounded-full bg-muted flex items-center justify-center",
            "transition-all duration-200",
            "ring-2 ring-ring/30",
            "hover:ring-ring/50",
            "focus-visible:outline-none focus-visible:ring-ring",
            open && "ring-ring",
            className
          )}
          aria-label={t("userUid", { uid: currentUid })}
        >
          <span className="text-sm font-medium text-muted-foreground">
            {username?.charAt(0)?.toUpperCase() || currentUid?.charAt(0)?.toUpperCase() || "U"}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-48 rounded-xl shadow-lg"
        sideOffset={8}
      >
        {/* 用户 ID 显示 */}
        <div className="px-3 py-2 text-xs text-muted-foreground border-b">
          {t("userUid", { uid: currentUid })}
        </div>

        {/* 复制配置 */}
        <DropdownMenuItem onClick={handleCopyConfig}>
          <Clipboard className="mr-2 size-4" />
          {t("authTokenConfig")}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* 登出 */}
        <DropdownMenuItem
          onClick={handleLogout}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 size-4" />
          {t("logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>

      {/* 配置模态窗口 */}
      <Dialog open={configModalOpen} onOpenChange={setConfigModalOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-lg mx-auto rounded-lg sm:rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg truncate pr-8">
              {configModalIsError ? t("copyConfigError") : (t("authTokenConfig") || "仓库配置")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <pre className="p-3 sm:p-4 rounded-xl bg-muted text-xs sm:text-sm overflow-x-auto max-h-48 sm:max-h-64 font-mono whitespace-pre-wrap break-all">
              {getConfigJson()}
            </pre>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
              <Button variant="outline" onClick={() => setConfigModalOpen(false)} className="w-full sm:w-auto rounded-xl">
                {t("close") || "关闭"}
              </Button>
              <Button
                className="w-full sm:w-auto rounded-xl bg-sky-700 hover:bg-sky-900 text-white transition-colors border-none shadow-sm"
                onClick={() => {
                  window.location.href = getObsidianUrl();
                }}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                {t("oneClickImport")}
              </Button>

              <Button
                onClick={() => {
                  navigator.clipboard.writeText(getConfigJson())
                    .then(() => toast.success(t("copyConfigSuccess")))
                    .catch(err => toast.error(t("error") + err));
                }}
                className="w-full sm:w-auto rounded-xl"
              >
                <Clipboard className="h-4 w-4 mr-2" />
                {t("copy") || "复制"}
              </Button>

            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DropdownMenu>
  )
}

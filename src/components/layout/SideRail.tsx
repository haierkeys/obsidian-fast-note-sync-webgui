import { Database, FileText, Trash2, Settings, RefreshCw, GitBranch } from "lucide-react";
import { ProfileButton } from "@/components/navigation/ProfileButton";
import { useAppStore, type ModuleId } from "@/stores/app-store";
import { NavItem } from "@/components/navigation/NavItem";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";


interface SideRailProps {
  /** 是否为管理员 */
  isAdmin: boolean
  /** 登出回调 */
  onLogout: () => void
  /** 额外的 CSS 类名 */
  className?: string
}

/**
 * SideRail - 桌面端侧边导航栏
 *
 * 极简设计的垂直导航条：
 * - 宽度 w-16 (64px)
 * - 顶部 Logo
 * - 中间导航项
 * - 底部用户头像
 * - 柔和背景 (bg-muted/30)
 */
export function SideRail({ isAdmin, onLogout, className }: SideRailProps) {
  const { t } = useTranslation()
  const { currentModule, setModule, versionInfo } = useAppStore()

  // 导航项配置
  const navItems: Array<{
    id: ModuleId
    icon: typeof Database
    labelKey: string
    adminOnly?: boolean
    isPlanned?: boolean
  }> = [
      { id: "vaults", icon: Database, labelKey: "menuVaults" },
      { id: "notes", icon: FileText, labelKey: "menuNotes" },
      { id: "trash", icon: Trash2, labelKey: "menuTrash" },
      { id: "settings", icon: Settings, labelKey: "menuSettings", adminOnly: true },
    ]

  // 计划中的功能
  const plannedItems = [
    { id: "sync", icon: RefreshCw, labelKey: "menuSync", isPlanned: true },
    { id: "git", icon: GitBranch, labelKey: "menuGit", isPlanned: true },
  ]

  const handleNavClick = (id: ModuleId) => {
    setModule(id)
  }

  return (
    <aside
      className={cn(
        "w-16 flex flex-col items-center py-4 bg-muted/30",
        className
      )}
    >
      {/* Brand Logo */}
      <div className="mb-6 flex items-center justify-center">
        <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <span className="text-primary font-bold text-sm">FN</span>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 flex flex-col items-center gap-2">
        {navItems.map((item) => {
          // 如果是管理员专属且用户不是管理员，则跳过
          if (item.adminOnly && !isAdmin) return null

          return (
            <NavItem
              key={item.id}
              icon={item.icon}
              label={t(item.labelKey)}
              isActive={currentModule === item.id}
              onClick={() => handleNavClick(item.id)}
              tooltipSide="right"
              showDot={item.id === 'settings' && !!versionInfo?.versionIsNew}
            />
          )
        })}

        {/* 分隔线 */}
        <div className="w-8 h-px bg-border/50 my-2" />

        {/* 计划中的功能 */}
        {plannedItems.map((item) => (
          <NavItem
            key={item.id}
            icon={item.icon}
            label={t(item.labelKey)}
            isActive={false}
            onClick={() => { }}
            tooltipSide="right"
          />
        ))}
      </nav>

      {/* Profile Button */}
      <ProfileButton onLogout={onLogout} />
    </aside>
  )
}

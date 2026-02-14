import { Database, FileText, Trash2, Settings, RefreshCw, GitBranch, Paperclip } from "lucide-react";
import { useAppStore, type ModuleId } from "@/stores/app-store";
import { NavItem } from "@/components/navigation/NavItem";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";


interface FloatingNavProps {
  isAdmin: boolean
  className?: string
}

/**
 * FloatingNav - 悬浮导航栏
 *
 * - 移动端：固定在底部中央
 * - 桌面端：sticky 定位，与内容卡片顶部对齐
 * - 圆角胶囊形状 (rounded-2xl)
 * - 毛玻璃背景
 * - 动画指示器
 */
export function FloatingNav({ isAdmin, className }: FloatingNavProps) {
  const { t } = useTranslation()
  const { currentModule, setModule } = useAppStore()

  const navItems: Array<{
    id: ModuleId
    icon: typeof Database
    labelKey: string
    adminOnly?: boolean
  }> = [
      { id: "vaults", icon: Database, labelKey: "menuVaults" },
      { id: "notes", icon: FileText, labelKey: "menuNotes" },
      { id: "files", icon: Paperclip, labelKey: "menuFiles" },
      { id: "trash", icon: Trash2, labelKey: "menuTrash" },
      { id: "settings", icon: Settings, labelKey: "menuSettings", adminOnly: true },
    ]

  // 计划中的功能
  const plannedItems: Array<{
    id: ModuleId
    icon: typeof Database
    labelKey: string
  }> = [
      { id: "sync", icon: RefreshCw, labelKey: "menuSync" },
      { id: "git", icon: GitBranch, labelKey: "menuGit" },
    ]

  const visibleItems = navItems.filter(item => !item.adminOnly || isAdmin)

  return (
    <div className={cn(
      // 移动端：fixed 定位，不占用文档流空间
      "fixed bottom-1 left-1/2 -translate-x-1/2 z-50",
      // 桌面端：相对定位，由于父容器 overflow:hidden 且 MainContent 独立滚动，这里自然会保持固定
      "md:relative md:bottom-auto md:left-auto md:translate-x-0 md:pt-6 md:pl-4",
      className
    )}>
      <motion.nav
        aria-label="Main Navigation"
        className={cn(
          // 移动端：水平排列
          "flex items-center gap-1 p-2",
          // 桌面端：垂直排列
          "md:flex-col md:gap-1 md:p-2",
          // 样式
          "bg-sidebar text-sidebar-foreground border border-sidebar-border rounded-lg",
          "custom-shadow backdrop-blur-sm"
        )}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {visibleItems.map((item) => (
          <NavItem
            key={item.id}
            icon={item.icon}
            label={t(item.labelKey)}
            isActive={currentModule === item.id}
            onClick={() => setModule(item.id)}
            tooltipSide="right"
          />
        ))}

        {/* 计划中的功能 - 桌面端显示 */}
        <div className="hidden md:block w-8 h-px bg-border/50 my-1" />

        {plannedItems.map((item) => (
          <NavItem
            key={item.id}
            icon={item.icon}
            label={t(item.labelKey)}
            isActive={currentModule === item.id}
            onClick={() => setModule(item.id)}
            tooltipSide="right"
          />
        ))}
      </motion.nav>
    </div>
  )
}

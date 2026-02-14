import { useState, useRef, useEffect } from "react";
import type { LucideIcon } from "lucide-react";
import { useMobile } from "@/hooks/use-mobile";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";


interface NavItemProps {
  /** 图标组件 */
  icon: LucideIcon
  /** 标签文本，用于 tooltip 显示 */
  label: string
  /** 是否为激活状态 */
  isActive: boolean
  /** 点击回调 */
  onClick: () => void
  /** 是否为计划中的功能 */
  isPlanned?: boolean
  /** tooltip 显示位置 */
  tooltipSide?: "right" | "top"
  /** tooltip 延迟显示时间（毫秒） */
  tooltipDelay?: number
  /** 是否显示提醒红点 */
  showDot?: boolean
}

/**
 * NavItem - 导航项组件
 *
 * 极简设计的图标按钮，支持：
 * - 激活状态样式
 * - 悬停 tooltip（仅桌面端）
 * - 点击缩放动画
 * - 键盘导航
 */
export function NavItem({
  icon: Icon,
  label,
  isActive,
  onClick,
  isPlanned = false,
  tooltipSide = "right",
  tooltipDelay = 500,
  showDot = false,
}: NavItemProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const timerRef = useRef<number | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })
  const isMobile = useMobile()

  // 计算 tooltip 位置
  useEffect(() => {
    if (showTooltip && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      if (tooltipSide === "right") {
        setTooltipPosition({
          top: rect.top + rect.height / 2,
          left: rect.right + 8,
        })
      } else {
        setTooltipPosition({
          top: rect.top - 8,
          left: rect.left + rect.width / 2,
        })
      }
    }
  }, [showTooltip, tooltipSide])

  const handleMouseEnter = () => {
    // 移动端不显示 tooltip
    if (isMobile) return

    timerRef.current = window.setTimeout(() => {
      setShowTooltip(true)
    }, tooltipDelay)
  }

  const handleMouseLeave = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setShowTooltip(false)
  }

  // 清理定时器
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current)
      }
    }
  }, [])

  const tooltipElement = showTooltip && !isMobile ? (
    <div
      className={cn(
        "fixed z-[9999] px-2 py-1 text-xs font-medium whitespace-nowrap",
        "bg-popover text-popover-foreground",
        "rounded-md shadow-md border border-border",
        "animate-in fade-in-0 zoom-in-95 duration-200"
      )}
      style={{
        top: tooltipPosition.top,
        left: tooltipPosition.left,
        transform: tooltipSide === "top"
          ? "translate(-50%, -100%)"
          : "translateY(-50%)",
      }}
      role="tooltip"
    >
      {label}
    </div>
  ) : null

  return (
    <div className="relative">
      <motion.button
        ref={buttonRef}
        onClick={onClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={cn(
          "relative p-3 rounded-xl transition-colors duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isActive
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
        )}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        aria-label={label}
        aria-current={isActive ? "page" : undefined}
      >
        <Icon className="size-5" strokeWidth={2} />
        {isPlanned && (
          <span className="absolute -top-1 -right-1 size-2 bg-ring rounded-full" />
        )}
        {showDot && (
          <span className="absolute top-1 right-1 size-2 bg-red-500 rounded-full border border-background" />
        )}
      </motion.button>

      {/* Tooltip - 使用 Portal 渲染到 body */}
      {typeof document !== 'undefined' && createPortal(tooltipElement, document.body)}
    </div>
  )
}

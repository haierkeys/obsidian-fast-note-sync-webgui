import React, { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"

type TooltipSide = "top" | "right" | "bottom" | "left"
type TooltipAlign = "start" | "center" | "end"

interface TooltipProps {
  /** 触发元素 */
  children: React.ReactNode
  /** 提示文本内容 */
  content: string
  /** 显示延迟（毫秒） */
  delay?: number
  /** 提示框位置 */
  side?: TooltipSide
  /** 提示框对齐方式 */
  align?: TooltipAlign
  /** 是否禁用 */
  disabled?: boolean
  /** 额外的 CSS 类名 */
  className?: string
}

/**
 * Tooltip - 优化的提示框组件
 *
 * 特性：
 * - 智能位置计算，支持四个方向
 * - Portal 渲染，避免 z-index 和溢出问题
 * - 完整的无障碍支持 (ARIA)
 * - 键盘支持 (ESC 关闭)
 * - 移动端友好
 */
export function Tooltip({
  children,
  content,
  delay = 300,
  side = "top",
  align = "center",
  disabled = false,
  className,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const timerRef = useRef<number | null>(null)
  const triggerRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ top: 0, left: 0 })

  // 计算提示框位置
  useEffect(() => {
    if (isVisible && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const offset = 8 // 提示框与触发元素的距离

      let top = 0
      let left = 0

      // 计算基础位置
      switch (side) {
        case "top":
          top = rect.top - offset
          break
        case "bottom":
          top = rect.bottom + offset
          break
        case "left":
          top = rect.top + rect.height / 2
          left = rect.left - offset
          break
        case "right":
          top = rect.top + rect.height / 2
          left = rect.right + offset
          break
      }

      // 计算对齐方式
      if (side === "top" || side === "bottom") {
        switch (align) {
          case "start":
            left = rect.left
            break
          case "center":
            left = rect.left + rect.width / 2
            break
          case "end":
            left = rect.right
            break
        }
      } else {
        switch (align) {
          case "start":
            top = rect.top
            break
          case "center":
            top = rect.top + rect.height / 2
            break
          case "end":
            top = rect.bottom
            break
        }
      }

      setPosition({ top, left })
    }
  }, [isVisible, side, align])

  const handleMouseEnter = () => {
    if (disabled) return

    timerRef.current = window.setTimeout(() => {
      setIsVisible(true)
    }, delay)
  }

  const handleMouseLeave = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setIsVisible(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsVisible(false)
    }
  }

  // 清理定时器
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current)
      }
    }
  }, [])

  // 计算 transform 原点
  const getTransformOrigin = () => {
    switch (side) {
      case "top":
        return "bottom center"
      case "bottom":
        return "top center"
      case "left":
        return "right center"
      case "right":
        return "left center"
    }
  }

  // 计算 transform 位移
  const getTransform = () => {
    switch (side) {
      case "top":
        return "translate(-50%, -100%)"
      case "bottom":
        return "translate(-50%, 0%)"
      case "left":
        return "translate(-100%, -50%)"
      case "right":
        return "translate(0%, -50%)"
    }
  }

  const tooltipElement = isVisible && !disabled ? (
    <div
      className={cn(
        "fixed z-[9999] px-2 py-1 text-xs font-medium whitespace-nowrap",
        "bg-popover text-popover-foreground",
        "rounded-md shadow-md border border-border",
        "animate-in fade-in-0 zoom-in-95 duration-200",
        "pointer-events-none",
        className
      )}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: getTransform(),
        transformOrigin: getTransformOrigin(),
      }}
      role="tooltip"
      onKeyDown={handleKeyDown}
    >
      {content}
    </div>
  ) : null

  return (
    <div
      ref={triggerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      {children}
      {typeof document !== "undefined" && createPortal(tooltipElement, document.body)}
    </div>
  )
}

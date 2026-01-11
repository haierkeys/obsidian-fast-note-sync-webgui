import { cn } from "@/lib/utils"
import { useAppStore } from "@/stores/app-store"
import { useMobile } from "@/hooks/use-mobile"

interface MainContentProps {
  /** 子组件 */
  children: React.ReactNode
  /** 额外的 CSS 类名 */
  className?: string
}

/**
 * MainContent - 主内容区域组件
 * 
 * 现代设计的内容容器：
 * - 设置页面：无外层卡片，直接显示分组卡片
 * - 其他页面：圆角卡片 (rounded-3xl) + 柔和阴影
 * - 移动端底部留白（为底部导航栏留空间）
 */
export function MainContent({ children, className }: MainContentProps) {
  const { currentModule } = useAppStore()
  const isMobile = useMobile()
  
  // 设置页面不需要外层卡片容器
  const isSettingsPage = currentModule === 'settings'

  return (
    <main
      className={cn(
        "flex-1 flex flex-col min-h-0 overflow-hidden",
        "p-2 sm:p-4 md:p-6",
        // 设置页面不需要额外底部留白，其他页面在移动端需要为底部导航留空间
        isMobile && !isSettingsPage && "pb-18",
        className
      )}
    >
      {isSettingsPage ? (
        <div className="flex-1 overflow-auto min-h-0">
          {children}
        </div>
      ) : (
        <div className="bg-card rounded-2xl sm:rounded-3xl shadow-sm p-3 sm:p-6 md:p-5 flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 flex flex-col min-h-0 overflow-auto px-1">
            {children}
          </div>
        </div>
      )}
    </main>
  )
}

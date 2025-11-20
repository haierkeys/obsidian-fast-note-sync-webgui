// confirm-dialog-context.tsx
import React, { createContext, useContext, useState, ReactNode } from "react"
import { ConfirmDialog } from "@/components/dialog/confirm-dialog"

// 定义上下文的类型
interface ConfirmDialogContextType {
  isDialogOpen: boolean
  message: string
  type: string
  openConfirmDialog: (message: string, type?: string, onConfirm?: () => void, children?: ReactNode) => void
  closeDialog: () => void
}

// 创建上下文
const ConfirmDialogContext = createContext<ConfirmDialogContextType | undefined>(undefined)

// 提供者组件
export const ConfirmDialogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [type, setType] = useState("error")
  const [handleConfirm, setHandleConfirm] = useState<() => void | undefined>()
  const [customChildren, setCustomChildren] = useState<ReactNode | undefined>()

  const handleCancel = () => {
    setIsDialogOpen(false)
    setMessage("")
    setType("error")
    setHandleConfirm(undefined)
    setCustomChildren(undefined)
  }

  const handleConfirmClick = () => {
    if (handleConfirm) {
      handleConfirm()
    }
    handleCancel()
  }

  const openConfirmDialog = (message: string, type?: string, onConfirm?: () => void, children?: ReactNode) => {
    setMessage(message)
    setType(type || "error")
    setHandleConfirm(() => onConfirm)
    setCustomChildren(children)
    setIsDialogOpen(true)
  }

  return (
    <ConfirmDialogContext.Provider value={{ isDialogOpen, message, type, openConfirmDialog, closeDialog: handleCancel }}>
      {children}
      <ConfirmDialog isOpen={isDialogOpen} onCancel={handleCancel} onConfirm={handleConfirmClick} message={message} type={type}>
        {customChildren}
      </ConfirmDialog>
    </ConfirmDialogContext.Provider>
  )
}

// 自定义钩子
export const useConfirmDialog = () => {
  const context = useContext(ConfirmDialogContext)
  if (!context) {
    throw new Error("useConfirmDialog must be used within a ConfirmDialogProvider")
  }
  return context
}

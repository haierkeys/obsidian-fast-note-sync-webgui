import { Dialog, DialogPanel, DialogTitle, Description } from "@headlessui/react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
// showError.ts
import React from "react";


type ConfirmDialogProps = {
  isOpen: boolean
  onCancel: () => void
  onConfirm?: () => void
  message: string
  type?: string
  children?: React.ReactNode // 新增 children 参数
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onCancel,
  onConfirm,
  message,
  type = "error",
  children, // 使用 children 参数
}) => {
  const { t } = useTranslation()

  let title
  if (type == "success") {
    title = (
      <DialogTitle className="text-lg font-semibold flex items-center text-green-500 gap-1">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6 w-6 h-6">
          <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
        </svg>
        {t("success")}
      </DialogTitle>
    )
  } else if (type == "error") {
    title = (
      <DialogTitle className="text-lg font-semibold flex items-center text-red-500 gap-1">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6 w-6 h-6">
          <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z" clipRule="evenodd" />
        </svg>
        {t("error")}
      </DialogTitle>
    )
  } else if (type == "warning") {
    title = (
      <DialogTitle className="text-lg font-semibold flex items-center text-yellow-500 gap-1">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6 w-6 h-6">
          <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
        </svg>
        {t("warning")}
      </DialogTitle>
    )
  } else if (type == "info") {
    title = (
      <DialogTitle className="text-lg font-semibold flex items-center text-blue-500 gap-1">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6 w-6 h-6">
          <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 0 1 .67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 1 1-.671-1.34l.041-.022ZM12 9a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
        </svg>
        {t("info")}
      </DialogTitle>
    )
  } else if (type == "confirm") {
    title = (
      <DialogTitle className="text-lg font-semibold flex items-center text-red-500 gap-1">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6 w-6 h-6">
          <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm11.378-3.917c-.89-.777-2.366-.777-3.255 0a.75.75 0 0 1-.988-1.129c1.454-1.272 3.776-1.272 5.23 0 1.513 1.324 1.513 3.518 0 4.842a3.75 3.75 0 0 1-.837.552c-.676.328-1.028.774-1.028 1.152v.75a.75.75 0 0 1-1.5 0v-.75c0-1.279 1.06-2.107 1.875-2.502.182-.088.351-.199.503-.331.83-.727.83-1.857 0-2.584ZM12 18a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
        </svg>
        {t("confirm")}
      </DialogTitle>
    )
  }

  let buttons
  if (type == "confirm") {
    buttons = (
      <div className="mt-4 flex justify-end">
        <Button size="sm" variant="outline" className="mr-2" onClick={onCancel}>
          {t("cancel")}
        </Button>
        <Button size="sm" variant={type === "confirm" ? "destructive" : "default"} onClick={onConfirm}>
          {t("confirm")}
        </Button>
      </div>
    )
  } else {
    buttons = (
      <div className="mt-4 flex justify-end">
        <Button size="sm" onClick={onCancel}>
          {t("close")}
        </Button>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onClose={onCancel}>
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
        <DialogPanel className="w-1/3 bg-white rounded-lg shadow-lg p-6">
          {title}
          <Description className="mt-2 text-sm text-muted-foreground">{message}</Description>
          {children} {/* 渲染传入的子组件 */}
          {buttons}
        </DialogPanel>
      </div>
    </Dialog>
  )
}

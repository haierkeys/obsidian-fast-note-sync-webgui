import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { Scissors, Copy, Clipboard, CheckSquare, RotateCcw, RotateCw } from "lucide-react";

interface ContextMenuProps {
  children: React.ReactNode;
}

interface MenuPosition {
  x: number;
  y: number;
}

interface MenuItem {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  action: () => void;
  disabled?: boolean;
  shortcut?: string;
  type?: "item" | "separator";
}

// 删除选中文本的辅助函数（替代 document.execCommand("delete")）
function deleteSelection(): void {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const activeElement = document.activeElement as HTMLElement;
  
  // 处理 input/textarea
  if (activeElement?.tagName === "INPUT" || activeElement?.tagName === "TEXTAREA") {
    const input = activeElement as HTMLInputElement | HTMLTextAreaElement;
    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;
    if (start !== end) {
      const value = input.value;
      input.value = value.slice(0, start) + value.slice(end);
      input.selectionStart = input.selectionEnd = start;
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
    return;
  }

  // 处理 contentEditable
  if (activeElement?.isContentEditable) {
    const range = selection.getRangeAt(0);
    if (!range.collapsed) {
      range.deleteContents();
      // 触发 input 事件
      activeElement.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }
}

// 插入文本的辅助函数
async function pasteTextToElement(
  text: string, 
  targetElement: HTMLElement | null,
  savedRange: Range | null
): Promise<void> {
  if (!targetElement) return;

  // 找到实际的可编辑元素
  let editableElement: HTMLElement | null = null;
  
  if (targetElement.tagName === "INPUT" || targetElement.tagName === "TEXTAREA") {
    editableElement = targetElement;
  } else {
    editableElement = targetElement.isContentEditable 
      ? targetElement 
      : targetElement.closest("[contenteditable='true']") as HTMLElement;
  }

  if (!editableElement) return;

  // 聚焦元素
  editableElement.focus();

  // 对于 input/textarea，直接操作值
  if (editableElement.tagName === "INPUT" || editableElement.tagName === "TEXTAREA") {
    const input = editableElement as HTMLInputElement | HTMLTextAreaElement;
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    const value = input.value;
    input.value = value.slice(0, start) + text + value.slice(end);
    input.selectionStart = input.selectionEnd = start + text.length;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    return;
  }

  // 对于 contentEditable，恢复选区后使用 execCommand
  if (savedRange) {
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(savedRange);
    }
  }

  // 使用 execCommand 插入文本（虽然已弃用但对富文本编辑器最可靠）
   
  const success = document.execCommand("insertText", false, text);
  
  if (!success) {
    // 后备方案：手动插入
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      const textNode = document.createTextNode(text);
      range.insertNode(textNode);
      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
      selection.removeAllRanges();
      selection.addRange(range);
      editableElement.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }
}

export function ContextMenuProvider({ children }: ContextMenuProps) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<MenuPosition>({ x: 0, y: 0 });
  const [hasSelection, setHasSelection] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const menuRef = useRef<HTMLDivElement>(null);
  const targetElementRef = useRef<HTMLElement | null>(null);
  const savedRangeRef = useRef<Range | null>(null);

  // 检查是否可以撤销/重做
  const checkUndoRedo = useCallback(() => {
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement?.isContentEditable || 
        activeElement?.tagName === "INPUT" || 
        activeElement?.tagName === "TEXTAREA") {
      // 对于可编辑元素，假设可以撤销（浏览器会处理）
      setCanUndo(true);
      setCanRedo(true);
    } else {
      setCanUndo(false);
      setCanRedo(false);
    }
  }, []);

  const handleContextMenu = useCallback((e: MouseEvent) => {
    e.preventDefault();
    
    // 保存触发右键菜单的元素
    targetElementRef.current = e.target as HTMLElement;
    
    // 保存当前选区（用于粘贴时恢复）
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      savedRangeRef.current = selection.getRangeAt(0).cloneRange();
    } else {
      savedRangeRef.current = null;
    }
    
    // 检查是否有选中的文本
    setHasSelection(!!selection && selection.toString().length > 0);
    
    // 检查撤销/重做状态
    checkUndoRedo();
    
    // 计算菜单位置，确保不超出屏幕
    let x = e.clientX;
    let y = e.clientY;
    
    // 菜单大小估算（增加了菜单项）
    const menuWidth = 200;
    const menuHeight = 220;
    
    if (x + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth - 8;
    }
    if (y + menuHeight > window.innerHeight) {
      y = window.innerHeight - menuHeight - 8;
    }
    
    setPosition({ x, y });
    setVisible(true);
    setFocusedIndex(-1);
  }, [checkUndoRedo]);

  const handleClick = useCallback((e: MouseEvent) => {
    // 如果点击在菜单内部，不关闭
    if (menuRef.current?.contains(e.target as Node)) {
      return;
    }
    setVisible(false);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!visible) return;

    if (e.key === "Escape") {
      setVisible(false);
      return;
    }

    // 获取可用的菜单项（排除分隔线和禁用项）
    const items = menuRef.current?.querySelectorAll("button:not(:disabled)");
    if (!items || items.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex(prev => (prev + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex(prev => (prev - 1 + items.length) % items.length);
    } else if (e.key === "Enter" && focusedIndex >= 0) {
      e.preventDefault();
      (items[focusedIndex] as HTMLButtonElement).click();
    }
  }, [visible, focusedIndex]);

  // 聚焦当前选中的菜单项
  useEffect(() => {
    if (visible && focusedIndex >= 0) {
      const items = menuRef.current?.querySelectorAll("button:not(:disabled)");
      if (items && items[focusedIndex]) {
        (items[focusedIndex] as HTMLButtonElement).focus();
      }
    }
  }, [visible, focusedIndex]);

  useEffect(() => {
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleContextMenu, handleClick, handleKeyDown]);

  const handleCut = useCallback(async () => {
    try {
      const selection = window.getSelection();
      if (selection && selection.toString()) {
        await navigator.clipboard.writeText(selection.toString());
        deleteSelection();
      }
    } catch (err) {
      console.warn("Cut failed:", err);
    }
    setVisible(false);
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      const selection = window.getSelection();
      if (selection && selection.toString()) {
        await navigator.clipboard.writeText(selection.toString());
      }
    } catch (err) {
      console.warn("Copy failed:", err);
    }
    setVisible(false);
  }, []);

  const handlePaste = useCallback(async () => {
    const target = targetElementRef.current;
    const range = savedRangeRef.current;
    
    setVisible(false);
    
    // 延迟执行，确保菜单关闭后焦点可以恢复
    await new Promise(resolve => setTimeout(resolve, 10));
    
    try {
      const text = await navigator.clipboard.readText();
      await pasteTextToElement(text, target, range);
    } catch (err) {
      console.warn("Paste failed:", err);
    }
  }, []);

  const handleSelectAll = useCallback(() => {
    const activeElement = document.activeElement as HTMLElement;
    
    if (activeElement?.tagName === "INPUT" || activeElement?.tagName === "TEXTAREA") {
      const input = activeElement as HTMLInputElement | HTMLTextAreaElement;
      input.select();
    } else if (activeElement?.isContentEditable) {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(activeElement);
      selection?.removeAllRanges();
      selection?.addRange(range);
    } else {
      // 选择整个文档
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(document.body);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
    setVisible(false);
  }, []);

  const handleUndo = useCallback(() => {
    // 使用 History API 或触发 Ctrl+Z
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement) {
      activeElement.dispatchEvent(new KeyboardEvent("keydown", {
        key: "z",
        ctrlKey: true,
        bubbles: true
      }));
    }
    setVisible(false);
  }, []);

  const handleRedo = useCallback(() => {
    // 触发 Ctrl+Y 或 Ctrl+Shift+Z
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement) {
      activeElement.dispatchEvent(new KeyboardEvent("keydown", {
        key: "y",
        ctrlKey: true,
        bubbles: true
      }));
    }
    setVisible(false);
  }, []);

  const menuItems: MenuItem[] = [
    { 
      icon: RotateCcw, 
      label: t("undo") || "撤销", 
      action: handleUndo, 
      disabled: !canUndo,
      shortcut: "Ctrl+Z"
    },
    { 
      icon: RotateCw, 
      label: t("redo") || "重做", 
      action: handleRedo, 
      disabled: !canRedo,
      shortcut: "Ctrl+Y"
    },
    { type: "separator", label: "", action: () => {} },
    { 
      icon: Scissors, 
      label: t("cut") || "剪切", 
      action: handleCut, 
      disabled: !hasSelection,
      shortcut: "Ctrl+X"
    },
    { 
      icon: Copy, 
      label: t("copy") || "复制", 
      action: handleCopy, 
      disabled: !hasSelection,
      shortcut: "Ctrl+C"
    },
    { 
      icon: Clipboard, 
      label: t("paste") || "粘贴", 
      action: handlePaste,
      shortcut: "Ctrl+V"
    },
    { type: "separator", label: "", action: () => {} },
    { 
      icon: CheckSquare, 
      label: t("selectAll") || "全选", 
      action: handleSelectAll,
      shortcut: "Ctrl+A"
    },
  ];

  // 用于键盘导航的按钮索引计数
  let buttonIndex = -1;

  return (
    <>
      {children}
      {visible && createPortal(
        <div
          ref={menuRef}
          role="menu"
          aria-label={t("contextMenu") || "上下文菜单"}
          className={cn(
            "fixed z-[9999] min-w-[180px]",
            "bg-popover/95 text-popover-foreground backdrop-blur-md",
            "border border-border/50 rounded-xl shadow-xl",
            "animate-in fade-in-0 zoom-in-95 duration-150",
            "overflow-hidden"
          )}
          style={{ left: position.x, top: position.y }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <div className="py-1.5">
            {menuItems.map((item, index) => {
              if (item.type === "separator") {
                return (
                  <div 
                    key={`sep-${index}`} 
                    className="h-px bg-border/50 my-1.5 mx-2" 
                    role="separator"
                  />
                );
              }

              buttonIndex++;
              const currentButtonIndex = buttonIndex;
              const Icon = item.icon;

              return (
                <button
                  key={index}
                  role="menuitem"
                  onClick={item.action}
                  disabled={item.disabled}
                  tabIndex={focusedIndex === currentButtonIndex ? 0 : -1}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 text-sm mx-1.5",
                    "first:mt-0 last:mb-0",
                    "rounded-lg",
                    "hover:bg-accent/80 active:bg-accent",
                    "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent",
                    "transition-colors duration-100",
                    "outline-none focus:bg-accent/80 focus:ring-1 focus:ring-primary/50",
                    // 减去左右 margin 的宽度
                    "w-[calc(100%-0.75rem)]"
                  )}
                >
                  {Icon && <Icon className="h-4 w-4 text-muted-foreground shrink-0" />}
                  <span className="flex-1 text-left font-medium">{item.label}</span>
                  {item.shortcut && (
                    <kbd className="text-[10px] text-muted-foreground/70 font-mono bg-muted/50 px-1.5 py-0.5 rounded shrink-0">
                      {item.shortcut}
                    </kbd>
                  )}
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

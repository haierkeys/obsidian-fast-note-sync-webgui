import { Pencil, Trash2, Plus, Clipboard, FileText, Database, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useConfirmDialog } from "@/components/context/confirm-dialog-context";
import { useVaultHandle } from "@/components/api-handle/vault-handle";
import { VaultForm } from "@/components/vault/vault-form";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { VaultType } from "@/lib/types/vault";
import env from "@/env.ts";


interface VaultListProps {
  onNavigateToNotes?: (vaultName: string) => void;
}

export function VaultList({ onNavigateToNotes }: VaultListProps) {
  const { t } = useTranslation()
  const [vaults, setVaults] = useState<VaultType[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingVault, setEditingVault] = useState<VaultType | undefined>(undefined)

  const { handleVaultList, handleVaultDelete } = useVaultHandle()
  const { openConfirmDialog } = useConfirmDialog()

  const loadVaults = useCallback(() => {
    handleVaultList((data) => {
      setVaults(data)
    })
  }, [handleVaultList])

  useEffect(() => {
    loadVaults()
  }, [loadVaults])

  const handleDelete = async (id: string) => {
    openConfirmDialog(t("confirmDelete"), "confirm", async () => {
      await handleVaultDelete(id)
      setVaults(vaults.filter((vault) => vault.id !== id))
    })
  }

  // 格式化字节为 MB
  const formatBytes = (bytes: string | undefined): string => {
    if (!bytes) return "0 MB"
    const numBytes = parseInt(bytes)
    if (isNaN(numBytes)) return "0 MB"
    const mb = numBytes / (1024 * 1024)
    return `${mb.toFixed(2)} MB`
  }

  // 复制指定仓库的配置
  const handleCopyVaultConfig = (vaultName: string) => {
    const config = {
      api: env.API_URL,
      apiToken: localStorage.getItem("token")!,
      vault: vaultName,
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
    <div className="w-full">
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-bold">
            {t("vaultManagement")} ({vaults.length})
          </CardTitle>
          <Button
            onClick={() => {
              setEditingVault(undefined)
              setIsDialogOpen(true)
            }}
            size="sm">
            <Plus className="mr-2 h-4 w-4" />
            {t("addVault")}
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="pb-6 pt-2">
            {vaults.length === 0 ? (
              <div className="text-center text-gray-500 py-8">{t("noVaults")}</div>
            ) : (
              <div className="border-t border-b border-gray-200 divide-y divide-gray-200">
                {vaults.map((vault, index) => (
                  <div
                    key={vault.id}
                    className={`flex items-center justify-between px-6 py-3 transition-colors ${index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      } hover:bg-blue-50`}
                  >
                    <div className="flex items-center space-x-4 overflow-hidden">
                      <Database className="h-5 w-5 text-blue-500 flex-shrink-0" />
                      <div className="flex flex-col overflow-hidden">
                        <span
                          className="font-medium truncate text-base cursor-pointer hover:text-blue-600 hover:underline"
                          onClick={() => onNavigateToNotes && onNavigateToNotes(vault.vault)}
                        >
                          {vault.vault}
                        </span>
                        <div className="flex items-center sm:space-x-3 text-xs text-gray-400">
                          <span className="font-mono hidden sm:inline">ID: {vault.id}</span>
                          <span className="hidden sm:inline">•</span>
                          <span>{vault.noteCount} {t("note") || "Notes"}</span>
                          <span>•</span>
                          <span>{formatBytes(vault.size)}</span>
                          <span className="hidden sm:inline-flex items-center ml-2">
                            <Clock className="mr-1 h-3 w-3" />
                            {vault.updatedAt}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-blue-600 hover:bg-blue-50" onClick={() => onNavigateToNotes && onNavigateToNotes(vault.vault)} title={t("viewNotes")}>
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-purple-600 hover:bg-purple-50" onClick={() => handleCopyVaultConfig(vault.vault)} title={t("copyConfig").includes("Copy") ? `Copy ${vault.vault} Config` : `复制仓库 ${vault.vault} 配置`}>
                        <Clipboard className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-500 hover:text-green-600 hover:bg-green-50"
                        onClick={() => {
                          setEditingVault(vault)
                          setIsDialogOpen(true)
                        }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(vault.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle>{editingVault ? t("editVault") : t("addVault")}</DialogTitle>
          </DialogHeader>
          <VaultForm
            config={editingVault}
            onSubmit={() => {
              setIsDialogOpen(false)
              loadVaults()
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

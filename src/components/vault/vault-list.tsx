import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useConfirmDialog } from "@/components/context/confirm-dialog-context"
import { handleVault } from "@/components/api-handle/vault-handle"
import { Pencil, Trash2, Plus, Clipboard } from "lucide-react"
import { VaultForm } from "@/components/vault/vault-form"
import { Button } from "@/components/ui/button"
import { useTranslation } from "react-i18next"
import { VaultType } from "@/lib/types/vault"
import { useState, useEffect } from "react"
import env from "@/env.ts"

export function VaultList() {
  const { t } = useTranslation()
  const [vaults, setVaults] = useState<VaultType[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingVault, setEditingVault] = useState<VaultType | undefined>(undefined)

  const { handleVaultList, handleVaultDelete } = handleVault()
  const { openConfirmDialog } = useConfirmDialog()

  const loadVaults = () => {
    handleVaultList((data) => {
      setVaults(data)
    })
  }

  useEffect(() => {
    loadVaults()
  }, [])

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
    <div className="space-y-4 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{t("vaultManagement")}</h2>
        <Button
          onClick={() => {
            setEditingVault(undefined)
            setIsDialogOpen(true)
          }}
          size="sm"
          className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          {t("addVault")}
        </Button>
      </div>

      <div className="rounded-md border overflow-x-auto w-full">
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead>{t("vaultName")}</TableHead>
              <TableHead className="w-[100px]">{t("noteCount")}</TableHead>
              <TableHead className="w-[100px]">{t("size")}</TableHead>
              <TableHead className="w-[160px]">{t("updatedAt")}</TableHead>
              <TableHead className="w-[160px]">{t("createdAt")}</TableHead>
              <TableHead className="text-right w-[120px]">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vaults.map((vault) => (
              <TableRow key={vault.id}>
                <TableCell className="font-mono text-xs">{vault.id}</TableCell>
                <TableCell className="font-medium">{vault.vault}</TableCell>
                <TableCell>{vault.noteCount}</TableCell>
                <TableCell>{formatBytes(vault.size)}</TableCell>
                <TableCell className="text-sm">{vault.updatedAt}</TableCell>
                <TableCell className="text-sm">{vault.createdAt}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCopyVaultConfig(vault.vault)} title={t("copyConfig").includes("Copy") ? `Copy ${vault.vault} Config` : `复制仓库 ${vault.vault} 配置`}>
                      <Clipboard className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        setEditingVault(vault)
                        setIsDialogOpen(true)
                      }}>
                      <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(vault.id)}>
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {vaults.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  {t("noVaults")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

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

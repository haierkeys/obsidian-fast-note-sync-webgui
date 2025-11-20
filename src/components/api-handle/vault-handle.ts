import { useConfirmDialog } from "@/components/context/confirm-dialog-context";
import { addCacheBuster } from "@/lib/utils/cache-buster";
import { getBrowserLang } from "@/lib/i18n/utils";
import { VaultType } from "@/lib/types/vault";
import env from "@/env.ts";


export function handleVault() {
  const { openConfirmDialog } = useConfirmDialog()
  const token = localStorage.getItem("token")!

  const handleVaultList = async (callback: (key: VaultType[]) => void) => {
    const response = await fetch(addCacheBuster(env.API_URL + "/api/vault?limit=100"), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Domain: window.location.origin,
        Token: token,
        Lang: getBrowserLang(),
      },
    })
    if (!response.ok) {
      throw new Error("Network response was not ok")
    }
    const res = await response.json()
    if (res.code < 100 && res.code > 0) {
      callback(res.data)
    } else {
      return { success: false, error: res.message + ": " + res.details }
    }
  }

  const handleVaultDelete = async (id: string) => {
    const data = {
      id: id,
    }
    const response = await fetch(addCacheBuster(env.API_URL + "/api/vault"), {
      method: "DELETE",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
        Domain: window.location.origin,
        Token: token,
        Lang: getBrowserLang(),
      },
    })
    if (!response.ok) {
      throw new Error("Network response was not ok")
    }
    const res = await response.json()
    if (res.code > 100) {
      openConfirmDialog(res.message + ": " + res.details, "error")
    }
  }

  const handleVaultUpdate = async (data: Partial<VaultType>, callback: (data2: VaultType) => void) => {
    const response = await fetch(addCacheBuster(env.API_URL + "/api/vault"), {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
        Domain: window.location.origin,
        Token: token,
        Lang: getBrowserLang(),
      },
    })
    if (!response.ok) {
      throw new Error("Network response was not ok")
    }
    const res = await response.json()
    if (res.code < 100 && res.code > 0) {
      openConfirmDialog(res.message, "success")
      callback(res.data)
    } else {
      openConfirmDialog(res.message + ": " + res.details, "error")
    }
  }

  return {
    handleVaultList,
    handleVaultDelete,
    handleVaultUpdate,
  }
}

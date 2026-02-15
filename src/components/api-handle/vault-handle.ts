import { addCacheBuster } from "@/lib/utils/cache-buster";
import { toast } from "@/components/common/Toast";
import { VaultType } from "@/lib/types/vault";
import { getBrowserLang } from "@/i18n/utils";
import { useCallback, useMemo } from "react";
import env from "@/env.ts";


export function useVaultHandle() {
  const token = localStorage.getItem("token")!

  const handleVaultList = useCallback(async (callback: (key: VaultType[]) => void) => {
    const response = await fetch(addCacheBuster(env.API_URL + "/api/vault?limit=100"), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        Domain: window.location.origin,
        Lang: getBrowserLang(),
      },
    })
    if (!response.ok) {
      throw new Error("Network response was not ok")
    }
    const res = await response.json()
    if (res.code < 100 && res.code > 0) {
      callback(res.data || [])
    } else {
      return { success: false, error: res.message + ": " + res.details }
    }
  }, [token])

  const handleVaultDelete = useCallback(async (id: string) => {
    const data = {
      id: id,
    }
    const response = await fetch(addCacheBuster(env.API_URL + "/api/vault"), {
      method: "DELETE",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        Domain: window.location.origin,
        Lang: getBrowserLang(),
      },
    })
    if (!response.ok) {
      throw new Error("Network response was not ok")
    }
    const res = await response.json()
    if (res.code > 100) {
      toast.error(res.message + ": " + res.details)
    }
  }, [token])

  const handleVaultUpdate = useCallback(async (data: Partial<VaultType>, callback: (data2: VaultType) => void) => {
    const response = await fetch(addCacheBuster(env.API_URL + "/api/vault"), {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        Domain: window.location.origin,
        Lang: getBrowserLang(),
      },
    })
    if (!response.ok) {
      throw new Error("Network response was not ok")
    }
    const res = await response.json()
    if (res.code < 100 && res.code > 0) {
      toast.success(res.message)
      callback(res.data)
    } else {
      toast.error(res.message + ": " + res.details)
    }
  }, [token])

  return useMemo(() => ({
    handleVaultList,
    handleVaultDelete,
    handleVaultUpdate,
  }), [handleVaultList, handleVaultDelete, handleVaultUpdate])
}

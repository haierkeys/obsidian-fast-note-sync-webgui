import { useConfirmDialog } from "@/components/context/confirm-dialog-context";
import { addCacheBuster } from "@/lib/utils/cache-buster";
import type { ChangePassword } from "@/lib/types/user";
import { getBrowserLang } from "@/lib/i18n/utils";
import { useCallback, useMemo } from "react";
import env from "@/env.ts";


export function useUserHandle() {
  const { openConfirmDialog } = useConfirmDialog() // 使用 useContext 来获取上下文值
  const token = localStorage.getItem("token")!


  const handleUserInfo = useCallback(async (logout: () => void) => {
    console.log("handleUserInfo")
    const response = await fetch(addCacheBuster(env.API_URL + "/api/user/info"), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Domain: window.location.origin,
        Token: token,
        Lang: getBrowserLang(),
      },
    })

    console.log(response)
    if (!response.ok) {
      throw new Error("Network response was not ok")
    }
    const res = await response.json()
    if (res.code > 200 || res.code == 0) {
      logout()
    }
  }, [token])


  const handleUserChangePassword = useCallback(async (data: ChangePassword, callback: (data2: ChangePassword) => void) => {

    const formData = { ...data }

    const response = await fetch(addCacheBuster(env.API_URL + "/api/user/change_password"), {
      method: "POST",
      body: JSON.stringify(formData),
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

      callback(data)
    } else {
      openConfirmDialog(res.message + ": " + res.details, "error")
    }
  }, [token, openConfirmDialog])


  return useMemo(() => ({
    handleUserChangePassword, handleUserInfo
  }), [handleUserChangePassword, handleUserInfo])
}

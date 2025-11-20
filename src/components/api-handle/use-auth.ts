import type { LoginFormData, RegisterFormData } from "@/lib/validations/user-schema";
import { addCacheBuster } from "@/lib/utils/cache-buster";
import { getBrowserLang } from "@/lib/i18n/utils";
import { useState } from "react";
import env from "@/env.ts";


export function useAuth() {
  const [isLoading, setIsLoading] = useState(false)

  const login = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      const response = await fetch(addCacheBuster(env.API_URL + "/api/user/login"), {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
          Domain: window.location.origin,
          Lang: getBrowserLang(),
        },
      })

      if (!response.ok) {
        throw new Error("Network response was not ok")
      }

      const res = await response.json()
      if (res.code < 100 && res.code > 0) {
        localStorage.setItem("token", res.data.token)
        localStorage.setItem("username", res.data.username)
        localStorage.setItem("uid", res.data.uid)
        localStorage.setItem("avatar", res.data.avatar)
        localStorage.setItem("email", res.data.email)
        return { success: true, message: res.data.message }
      } else {
        return { success: false, error: res.message + ": " + res.details }
      }
    } catch (error) {
      return { success: false, error: "接口请求失败,请检查网络状态" }
    } finally {
      setIsLoading(false)
    }
  }

  const registerUser = async (data: RegisterFormData) => {
    setIsLoading(true)
    try {
      const response = await fetch(addCacheBuster(env.API_URL + "/api/user/register"), {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
          Domain: window.location.origin,
          Lang: getBrowserLang(),
        },
      })

      if (!response.ok) {
        throw new Error("Network response was not ok")
      }

      const res = await response.json()

      if (res.code < 100 && res.code > 0) {
        localStorage.setItem("token", res.data.token)
        localStorage.setItem("username", res.data.username)
        localStorage.setItem("uid", res.data.uid)
        localStorage.setItem("avatar", res.data.avatar)
        localStorage.setItem("email", res.data.email)
        return { success: true }
      } else {
        return { success: false, error: res.message + ": " + res.details }
      }
    } catch (error) {
      return { success: false, error: "注册失败，请重试" }
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isLoading,
    login,
    registerUser,
  }
}

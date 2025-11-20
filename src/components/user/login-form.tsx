import { createLoginSchema, type LoginFormData } from "@/lib/validations/user-schema"
import { useConfirmDialog } from "@/components/context/confirm-dialog-context"
import { useAuth } from "@/components/api-handle/use-auth"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { useTranslation } from "react-i18next"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { changeLang } from "@/lib/i18n/utils"
import { useForm } from "react-hook-form"
import { Languages } from "lucide-react"

interface LoginFormProps {
  onSuccess: () => void
  onRegister: () => void
}

export function LoginForm({ onSuccess, onRegister }: LoginFormProps) {
  const { t, i18n } = useTranslation()

  //登录相关
  const { isLoading, login } = useAuth()

  //消息提示
  const { openConfirmDialog } = useConfirmDialog()

  //表单验证
  const loginSchema = createLoginSchema(t)

  // prettier-ignore
  const { handleSubmit, register, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSoft = () => {
    window.open("https://github.com/haierkeys/fast-note-sync-service", "_blank", "noopener,noreferrer")
  }

  //登录处理
  const handleLoginSubmit = async (data: LoginFormData) => {
    const result = await login(data)
    if (result.success) {
      onSuccess()
    } else {
      openConfirmDialog(result.error!)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-5 space-y-4 relative">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <Button variant="outline" onClick={() => changeLang(i18n.language === "en" ? "zh" : "en")} className="text-sm font-medium hover:bg-slate-100 transition-colors">
          <Languages className="mr-2 h-4 w-4" />
          {i18n.language === "en" ? "中文" : "English"}
        </Button>
      </div>

      <div className="space-y-2">
        <div className="text-gray-500">
          <Button variant="link" onClick={onSoft} type="button" className="text-gray-500 p-0 pr-2">
            Obsidian Fast Note Sync Service
          </Button>
          <p className="text-gray-400 text-xs italic ">{t("subtitle")}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(handleLoginSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="credentials">{t("credentials")}</Label>
          <Input id="credentials" placeholder={t("credentialsPlaceholder")} {...register("credentials")} />
          {errors.credentials && <p className="text-sm text-red-500">{errors.credentials.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">{t("password")}</Label>
          <Input id="password" type="password" placeholder={t("passwordPlaceholder")} {...register("password")} />
          {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? t("loading") : t("login")}
        </Button>

        <div className="text-center mt-4">
          <Button variant="link" onClick={onRegister} type="button">
            {t("noAccount")} {t("register")}
          </Button>
        </div>
      </form>

      <div className="absolute bottom-4 "></div>
    </div>
  )
}

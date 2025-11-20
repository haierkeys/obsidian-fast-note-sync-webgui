import { handleVault } from "@/components/api-handle/vault-handle"
import { vaultSchema } from "@/lib/validations/vault-schema"
import { zodResolver } from "@hookform/resolvers/zod"
import type { VaultType } from "@/lib/types/vault"
import { Button } from "@/components/ui/button"
import { useTranslation } from "react-i18next"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"

interface VaultFormProps {
  config?: VaultType
  onSubmit: () => void
}

export function VaultForm({ config, onSubmit }: VaultFormProps) {
  const { t } = useTranslation()

  const { handleVaultUpdate } = handleVault()

  // prettier-ignore
  const { register, handleSubmit, formState: { errors } } = useForm<VaultType>({
    resolver: zodResolver(vaultSchema),
    defaultValues: config || {},
  })

  const onFormSubmit = (data: VaultType) => {
    if (config) {
      data.id = config.id
    }
    console.log(data)
    handleVaultUpdate(data, () => {
      onSubmit()
    })
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 border px-4 py-10  mb-6">
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label htmlFor="vault">{t("vaultName")}</Label>
          <Input id="vault" autoComplete="off" {...register("vault")} />
          {errors.vault && <p className="text-sm text-red-500">{errors.vault.message}</p>}
        </div>
      </div>

      <Button type="submit" className="w-full">
        {config ? t("save") : t("add")}
      </Button>
    </form>
  )
}

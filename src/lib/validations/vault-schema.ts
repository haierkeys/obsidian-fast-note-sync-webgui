import * as z from "zod";


export const vaultSchema = z.object({
    vault: z.string().min(1, "仓库名称不能为空"),
})

export type VaultFormData = z.infer<typeof vaultSchema>

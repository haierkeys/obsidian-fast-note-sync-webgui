import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSettingsStore, ToastPosition } from "@/lib/stores/settings-store";
import { useVersion } from "@/components/api-handle/use-version";
import { toast } from "@/components/common/Toast";
import { addCacheBuster } from "@/lib/utils/cache-buster";
import { Checkbox } from "@/components/ui/checkbox";
import { getBrowserLang } from "@/lib/i18n/utils";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef, useCallback } from "react";
import { Eye, EyeOff } from "lucide-react";
import { 
    Info, 
    GitBranch, 
    Tag, 
    Bell, 
    Type, 
    UserPlus, 
    HardDrive, 
    Trash2, 
    Clock, 
    Shield,
    Sun,
    User,
    Pencil,
    Lock,
    Loader2
} from "lucide-react";
import env from "@/env.ts";

const TOAST_POSITIONS: ToastPosition[] = [
    'top-left',
    'top-center',
    'top-right',
    'bottom-left',
    'bottom-center',
    'bottom-right',
];

interface SystemConfig {
    fontSet: string
    registerIsEnable: boolean
    fileChunkSize: string
    softDeleteRetentionTime: string
    uploadSessionTimeout: string
    adminUid: number
}

export function SystemSettings({ onBack }: { onBack?: () => void }) {
    const { t } = useTranslation()
    const [config, setConfig] = useState<SystemConfig | null>(null)
    const [loading, setLoading] = useState(true)
    const [autoSaving, setAutoSaving] = useState(false)
    const token = localStorage.getItem("token")
    const { toastPosition, setToastPosition } = useSettingsStore()
    const { versionInfo, isLoading: versionLoading } = useVersion()
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const pendingConfigRef = useRef<SystemConfig | null>(null)

    // 账户设置状态
    const [newUsername, setNewUsername] = useState("")
    const [savingUsername, setSavingUsername] = useState(false)
    const [oldPassword, setOldPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [savingPassword, setSavingPassword] = useState(false)
    const [showOldPassword, setShowOldPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    // adminUid 单独管理（手动保存）
    const [adminUidInput, setAdminUidInput] = useState("")
    const [savingAdminUid, setSavingAdminUid] = useState(false)

    // 自动保存配置（防抖）
    const autoSaveConfig = useCallback(async (newConfig: SystemConfig) => {
        setAutoSaving(true)
        try {
            const response = await fetch(addCacheBuster(env.API_URL + "/api/admin/config"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Token: token || "",
                    Lang: getBrowserLang(),
                },
                body: JSON.stringify(newConfig),
            })
            const res = await response.json()
            if (res.code === 0 || (res.code < 100 && res.code > 0)) {
                toast.success(t("saveSuccess") || "保存成功")
            } else {
                toast.error(res.message || t("saveFailed"))
            }
        } catch {
            toast.error(t("saveFailed"))
        } finally {
            setAutoSaving(false)
        }
    }, [token, t])

    // 更新配置并触发自动保存
    const updateConfig = useCallback((updates: Partial<SystemConfig>) => {
        if (!config) return
        const newConfig = { ...config, ...updates }
        setConfig(newConfig)
        pendingConfigRef.current = newConfig
        
        // 清除之前的定时器
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current)
        }
        
        // 防抖：500ms 后自动保存
        saveTimeoutRef.current = setTimeout(() => {
            if (pendingConfigRef.current) {
                autoSaveConfig(pendingConfigRef.current)
            }
        }, 500)
    }, [config, autoSaveConfig])

    // 清理定时器
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current)
            }
        }
    }, [])

    useEffect(() => {
        const fetchConfig = async () => {
            setLoading(true)
            try {
                const response = await fetch(addCacheBuster(env.API_URL + "/api/admin/config"), {
                    headers: {
                        Token: token || "",
                        Lang: getBrowserLang(),
                    },
                })
                const res = await response.json()
                if (res.code === 0 || (res.code < 100 && res.code > 0)) {
                    setConfig(res.data)
                    setAdminUidInput(String(res.data.adminUid))
                } else {
                    toast.error(res.message || t("error"))
                    onBack?.()
                }
            } catch {
                toast.error(t("error"))
                onBack?.()
            } finally {
                setLoading(false)
            }
        }
        fetchConfig()
    }, [token, t, onBack])

    // 修改用户名
    const handleChangeUsername = async () => {
        if (!newUsername.trim()) {
            toast.error(t("usernameRequired") || "请输入用户名")
            return
        }
        setSavingUsername(true)
        try {
            const formData = new FormData()
            formData.append("username", newUsername.trim())
            const response = await fetch(addCacheBuster(env.API_URL + "/api/user/change_username"), {
                method: "POST",
                headers: { Token: token || "" },
                body: formData,
            })
            const res = await response.json()
            if (res.status === true || res.code === 0) {
                toast.success(t("usernameChangedSuccess") || "用户名修改成功")
                localStorage.setItem("username", newUsername.trim())
                setNewUsername("")
            } else {
                toast.error(res.message || t("usernameChangeFailed") || "用户名修改失败")
            }
        } catch {
            toast.error(t("usernameChangeFailed") || "用户名修改失败")
        } finally {
            setSavingUsername(false)
        }
    }

    // 修改密码
    const handleChangePassword = async () => {
        if (!oldPassword || !newPassword || !confirmPassword) {
            toast.error(t("fillAllFields") || "请填写所有字段")
            return
        }
        if (newPassword !== confirmPassword) {
            toast.error(t("passwordMismatch") || "两次输入的密码不一致")
            return
        }
        setSavingPassword(true)
        try {
            const formData = new FormData()
            formData.append("oldPassword", oldPassword)
            formData.append("password", newPassword)
            formData.append("confirmPassword", confirmPassword)
            const response = await fetch(addCacheBuster(env.API_URL + "/api/user/change_password"), {
                method: "POST",
                headers: { Token: token || "" },
                body: formData,
            })
            const res = await response.json()
            if (res.status === true || res.code === 0) {
                toast.success(t("passwordChangedSuccess") || "密码修改成功")
                setOldPassword("")
                setNewPassword("")
                setConfirmPassword("")
            } else {
                toast.error(res.details || res.message || t("passwordChangeFailed") || "密码修改失败")
            }
        } catch {
            toast.error(t("passwordChangeFailed") || "密码修改失败")
        } finally {
            setSavingPassword(false)
        }
    }

    // 手动保存 adminUid
    const handleSaveAdminUid = async () => {
        if (!config) return
        const uidValue = adminUidInput.trim() === "" ? 0 : parseInt(adminUidInput)
        if (isNaN(uidValue)) {
            toast.error(t("invalidNumber") || "请输入有效数字")
            return
        }
        setSavingAdminUid(true)
        try {
            const newConfig = { ...config, adminUid: uidValue }
            const response = await fetch(addCacheBuster(env.API_URL + "/api/admin/config"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Token: token || "",
                    Lang: getBrowserLang(),
                },
                body: JSON.stringify(newConfig),
            })
            const res = await response.json()
            if (res.code === 0 || (res.code < 100 && res.code > 0)) {
                toast.success(t("saveSuccess") || "保存成功")
                setConfig(newConfig)
            } else {
                toast.error(res.message || t("saveFailed"))
            }
        } catch {
            toast.error(t("saveFailed"))
        } finally {
            setSavingAdminUid(false)
        }
    }

    if (loading) {
        return <div className="p-8 text-center">{t("loading")}</div>
    }

    if (!config) {
        return <div className="p-8 text-center text-destructive">{t("error")}</div>
    }

    return (
        <div className="flex flex-col gap-4 pb-24 md:columns-2 md:block md:[&>div]:mb-4 md:[&>div]:break-inside-avoid md:pb-4">
            {/* 自动保存指示器 */}
            {autoSaving && (
                <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2 shadow-lg">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">{t("autoSaving") || "保存中..."}</span>
                </div>
            )}
            {/* 版本信息 */}
            <div>
                <div className="rounded-3xl border border-border bg-card p-6 space-y-5">
                    <h2 className="text-lg font-bold text-card-foreground flex items-center gap-2">
                        <Info className="h-5 w-5" />
                        {t("versionInfo")}
                    </h2>
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <GitBranch className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm font-medium">{t("githubRepo")}</span>
                        </div>
                        <a 
                            href="https://github.com/haierkeys/obsidian-fast-note-sync" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                        >
                            haierkeys/fast-note-sync
                        </a>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Tag className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm font-medium">{t("currentVersion")}</span>
                        </div>
                        <code className="text-sm font-mono text-muted-foreground">
                            {versionLoading ? t("loading") : (versionInfo?.version || t("unknown"))}
                        </code>
                    </div>
                </div>
            </div>

            {/* 外观设置 */}
            <div>
                <div className="rounded-3xl border border-border bg-card p-6 space-y-5">
                    <h2 className="text-lg font-bold text-card-foreground flex items-center gap-2">
                        <Sun className="h-5 w-5" />
                        {t("appearance") || "外观"}
                    </h2>
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Bell className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm font-medium">{t("toastPosition")}</span>
                        </div>
                        <Select value={toastPosition} onValueChange={(value) => setToastPosition(value as ToastPosition)}>
                            <SelectTrigger className="w-36 rounded-xl">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                {TOAST_POSITIONS.map((pos) => (
                                    <SelectItem key={pos} value={pos} className="rounded-xl">
                                        {t(`position.${pos}`)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Type className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm font-medium">{t("fontSet")}</span>
                        </div>
                        <Input
                            value={config.fontSet}
                            onChange={(e) => updateConfig({ fontSet: e.target.value })}
                            placeholder="e.g. /static/fonts/font.css"
                            className="rounded-xl"
                        />
                        <p className="text-xs text-muted-foreground">{t("fontSetDesc")}</p>
                    </div>
                </div>
            </div>

            {/* 用户设置 */}
            <div>
                <div className="rounded-3xl border border-border bg-card p-6 space-y-5">
                    <h2 className="text-lg font-bold text-card-foreground flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        {t("userSettings") || "用户设置"}
                    </h2>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <UserPlus className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm font-medium">{t("registerIsEnable")}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="registerIsEnable"
                                checked={config.registerIsEnable}
                                onCheckedChange={(checked) => updateConfig({ registerIsEnable: !!checked })}
                            />
                            <Label htmlFor="registerIsEnable" className="text-sm">
                                {config.registerIsEnable ? t("isEnabled") : t("close")}
                            </Label>
                        </div>
                        <p className="text-xs text-muted-foreground">{t("registerIsEnableDesc")}</p>
                    </div>
                    <div className="border-t border-border" />
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Shield className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm font-medium">{t("adminUid")}</span>
                        </div>
                        <div className="flex gap-2">
                            <Input
                                value={adminUidInput}
                                onChange={(e) => setAdminUidInput(e.target.value)}
                                placeholder="e.g. 1"
                                className="rounded-xl flex-1"
                            />
                            <Button 
                                onClick={handleSaveAdminUid} 
                                disabled={savingAdminUid}
                                className="rounded-xl"
                            >
                                {savingAdminUid ? t("submitting") : t("save")}
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">{t("adminUidDesc")}</p>
                    </div>
                </div>
            </div>

            {/* 存储设置 */}
            <div>
                <div className="rounded-3xl border border-border bg-card p-6 space-y-5">
                    <h2 className="text-lg font-bold text-card-foreground flex items-center gap-2">
                        <HardDrive className="h-5 w-5" />
                        {t("storageSettings") || "存储设置"}
                    </h2>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <HardDrive className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm font-medium">{t("fileChunkSize")}</span>
                        </div>
                        <Input
                            value={config.fileChunkSize}
                            onChange={(e) => updateConfig({ fileChunkSize: e.target.value })}
                            placeholder="e.g. 1MB, 512KB"
                            className="rounded-xl"
                        />
                        <p className="text-xs text-muted-foreground">{t("fileChunkSizeDesc")}</p>
                    </div>
                    <div className="border-t border-border" />
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Trash2 className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm font-medium">{t("softDeleteRetentionTime")}</span>
                        </div>
                        <Input
                            value={config.softDeleteRetentionTime}
                            onChange={(e) => updateConfig({ softDeleteRetentionTime: e.target.value })}
                            placeholder="e.g. 30d, 24h"
                            className="rounded-xl"
                        />
                        <p className="text-xs text-muted-foreground">{t("softDeleteRetentionTimeDesc")}</p>
                    </div>
                    <div className="border-t border-border" />
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Clock className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm font-medium">{t("uploadSessionTimeout")}</span>
                        </div>
                        <Input
                            value={config.uploadSessionTimeout}
                            onChange={(e) => updateConfig({ uploadSessionTimeout: e.target.value })}
                            placeholder="e.g. 1h, 30m"
                            className="rounded-xl"
                        />
                        <p className="text-xs text-muted-foreground">{t("uploadSessionTimeoutDesc")}</p>
                    </div>
                </div>
            </div>

            {/* 账户设置 */}
            <div>
                <div className="rounded-3xl border border-border bg-card p-6 space-y-5">
                    <h2 className="text-lg font-bold text-card-foreground flex items-center gap-2">
                        <User className="h-5 w-5" />
                        {t("accountSettings") || "账户设置"}
                    </h2>
                    
                    {/* 修改用户名 */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Pencil className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm font-medium">{t("changeUsername") || "修改用户名"}</span>
                        </div>
                        <div className="flex gap-2">
                            <Input
                                value={newUsername}
                                onChange={(e) => setNewUsername(e.target.value)}
                                placeholder={t("enterNewUsername") || "请输入新用户名"}
                                className="rounded-xl flex-1"
                            />
                            <Button 
                                onClick={handleChangeUsername} 
                                disabled={savingUsername || !newUsername.trim()}
                                className="rounded-xl"
                            >
                                {savingUsername ? t("submitting") : t("save")}
                            </Button>
                        </div>
                    </div>

                    <div className="border-t border-border" />

                    {/* 修改密码 */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Lock className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm font-medium">{t("changePassword") || "修改密码"}</span>
                        </div>
                        <div className="space-y-3">
                            <div className="relative">
                                <Input
                                    type={showOldPassword ? "text" : "password"}
                                    value={oldPassword}
                                    onChange={(e) => setOldPassword(e.target.value)}
                                    placeholder={t("currentPassword") || "请输入当前密码"}
                                    className="rounded-xl pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowOldPassword(!showOldPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showOldPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            <div className="relative">
                                <Input
                                    type={showNewPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder={t("newPassword") || "请输入新密码"}
                                    className="rounded-xl pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            <div className="relative">
                                <Input
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder={t("confirmNewPassword") || "请确认新密码"}
                                    className="rounded-xl pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            <Button 
                                onClick={handleChangePassword} 
                                disabled={savingPassword || !oldPassword || !newPassword || !confirmPassword}
                                className="w-full rounded-xl"
                            >
                                {savingPassword ? t("submitting") : t("changePassword")}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

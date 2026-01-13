import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSettingsStore, ToastPosition, COLOR_SCHEMES } from "@/lib/stores/settings-store";
import { useVersion } from "@/components/api-handle/use-version";
import { useUpdateCheck } from "@/components/api-handle/use-update-check";
import { toast } from "@/components/common/Toast";
import { addCacheBuster } from "@/lib/utils/cache-buster";
import { Checkbox } from "@/components/ui/checkbox";
import { getBrowserLang } from "@/lib/i18n/utils";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { Eye, EyeOff, Save, Settings } from "lucide-react";
import { 
    Info, GitBranch, Tag, Bell, Type, UserPlus, HardDrive, Trash2, Clock, Shield,
    Sun, User, Lock, Loader2, Palette, RefreshCw, ExternalLink, CheckCircle, AlertCircle
} from "lucide-react";
import env from "@/env.ts";

const TOAST_POSITIONS: ToastPosition[] = [
    'top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right',
];

interface SystemConfig {
    fontSet: string
    registerIsEnable: boolean
    fileChunkSize: string
    softDeleteRetentionTime: string
    uploadSessionTimeout: string
    historyKeepVersions: number
    historySaveDelay: string
    adminUid: number
}

export function SystemSettings({ onBack }: { onBack?: () => void }) {
    const { t } = useTranslation()
    const [config, setConfig] = useState<SystemConfig | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const token = localStorage.getItem("token")
    const { toastPosition, setToastPosition, colorScheme, setColorScheme } = useSettingsStore()
    const { versionInfo, isLoading: versionLoading } = useVersion()
    const { checkUpdate, isChecking, updateResult } = useUpdateCheck()

    // 账户设置状态
    const [oldPassword, setOldPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [savingPassword, setSavingPassword] = useState(false)
    const [showOldPassword, setShowOldPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    const handleCheckUpdate = async () => {
        if (versionInfo?.version) {
            const result = await checkUpdate(versionInfo.version)
            if (result) {
                toast.success(result.hasUpdate ? t("newVersionAvailable") : t("alreadyLatest"))
            }
        }
    }

    const parseDurationToSeconds = (duration: string): number | null => {
        if (!duration) return null
        const match = duration.match(/^(\d+)(s|m|h|d)$/)
        if (!match) return null
        const value = parseInt(match[1])
        const unit = match[2]
        switch (unit) {
            case 's': return value
            case 'm': return value * 60
            case 'h': return value * 3600
            case 'd': return value * 86400
            default: return null
        }
    }

    const updateConfig = (updates: Partial<SystemConfig>) => {
        if (!config) return
        setConfig({ ...config, ...updates })
    }

    const handleSaveConfig = async () => {
        if (!config) return
        if (config.historyKeepVersions < 100) {
            toast.error(t("historyKeepVersionsMinError"))
            return
        }
        if (config.historySaveDelay) {
            const seconds = parseDurationToSeconds(config.historySaveDelay)
            if (seconds === null) {
                toast.error(t("historySaveDelayFormatError") || "历史记录保存延迟格式无效")
                return
            }
            if (seconds < 10) {
                toast.error(t("historySaveDelayMinError"))
                return
            }
        }
        setSaving(true)
        try {
            const response = await fetch(addCacheBuster(env.API_URL + "/api/admin/config"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                    Lang: getBrowserLang(),
                },
                body: JSON.stringify(config),
            })
            const res = await response.json()
            if (res.code === 0 || (res.code < 100 && res.code > 0)) {
                toast.success(t("saveSuccess"))
            } else {
                toast.error(res.message || t("saveFailed"))
            }
        } catch {
            toast.error(t("saveFailed"))
        } finally {
            setSaving(false)
        }
    }

    useEffect(() => {
        const fetchConfig = async () => {
            setLoading(true)
            try {
                const response = await fetch(addCacheBuster(env.API_URL + "/api/admin/config"), {
                    headers: { "Authorization": `Bearer ${token}`, Lang: getBrowserLang() },
                })
                const res = await response.json()
                if (res.code === 0 || (res.code < 100 && res.code > 0)) {
                    setConfig(res.data)
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

    const handleChangePassword = async () => {
        if (!oldPassword || !newPassword || !confirmPassword) {
            toast.error(t("fillAllFields"))
            return
        }
        if (newPassword !== confirmPassword) {
            toast.error(t("passwordMismatch"))
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
                headers: { "Authorization": `Bearer ${token}` },
                body: formData,
            })
            const res = await response.json()
            if (res.status === true || res.code === 0) {
                toast.success(t("passwordChangedSuccess"))
                setOldPassword("")
                setNewPassword("")
                setConfirmPassword("")
            } else {
                toast.error(res.details || res.message || t("passwordChangeFailed"))
            }
        } catch {
            toast.error(t("passwordChangeFailed"))
        } finally {
            setSavingPassword(false)
        }
    }

    if (loading) return <div className="p-8 text-center">{t("loading")}</div>
    if (!config) return <div className="p-8 text-center text-destructive">{t("error")}</div>

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-24 md:pb-4">
            {/* 左列 */}
            <div className="flex flex-col gap-4">
                {/* 版本信息 */}
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
                        <a href="https://github.com/haierkeys/fast-note-sync-service" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                            haierkeys/fast-note-sync-service
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
                    <div className="border-t border-border" />
                    <div className="space-y-3">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <RefreshCw className={`h-5 w-5 text-muted-foreground ${isChecking ? 'animate-spin' : ''}`} />
                                <span className="text-sm font-medium">{t("checkUpdate")}</span>
                            </div>
                            <Button variant="outline" size="sm" onClick={handleCheckUpdate} disabled={isChecking || versionLoading || !versionInfo?.version} className="rounded-xl">
                                {isChecking ? t("checking") : t("checkNow")}
                            </Button>
                        </div>
                        {updateResult && (
                            <div className={`rounded-xl p-4 ${updateResult.hasUpdate ? 'bg-primary/10 border border-primary/20' : 'bg-muted/50'}`}>
                                <div className="flex items-start gap-3">
                                    {updateResult.hasUpdate ? <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" /> : <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />}
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">{updateResult.hasUpdate ? t("newVersionAvailable") : t("alreadyLatest")}</span>
                                            {updateResult.latestVersion && <code className="text-xs font-mono bg-background px-2 py-0.5 rounded">{updateResult.latestVersion}</code>}
                                        </div>
                                        {updateResult.hasUpdate && updateResult.releaseUrl && (
                                            <a href={updateResult.releaseUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                                                {t("viewRelease")} <ExternalLink className="h-3 w-3" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 外观设置 */}
                <div className="rounded-3xl border border-border bg-card p-6 space-y-5">
                    <h2 className="text-lg font-bold text-card-foreground flex items-center gap-2">
                        <Sun className="h-5 w-5" />
                        {t("appearance")}
                    </h2>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Palette className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm font-medium">{t("colorScheme")}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {COLOR_SCHEMES.map((scheme) => (
                                <button key={scheme.value} onClick={() => { setColorScheme(scheme.value); toast.success(t("colorSchemeSwitched", { scheme: t(scheme.label) })) }}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${colorScheme === scheme.value ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}>
                                    <span className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: scheme.color }} />
                                    <span className="text-xs truncate">{t(scheme.label)}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="border-t border-border" />
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Bell className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm font-medium">{t("toastPosition")}</span>
                        </div>
                        <Select value={toastPosition} onValueChange={(value) => setToastPosition(value as ToastPosition)}>
                            <SelectTrigger className="w-36 rounded-xl"><SelectValue /></SelectTrigger>
                            <SelectContent className="rounded-xl">
                                {TOAST_POSITIONS.map((pos) => <SelectItem key={pos} value={pos} className="rounded-xl">{t(`position.${pos}`)}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* 账户设置 */}
                <div className="rounded-3xl border border-border bg-card p-6 space-y-5">
                    <h2 className="text-lg font-bold text-card-foreground flex items-center gap-2">
                        <User className="h-5 w-5" />
                        {t("accountSettings")}
                    </h2>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Lock className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm font-medium">{t("changePassword")}</span>
                        </div>
                        <div className="space-y-3">
                            <div className="relative">
                                <Input type={showOldPassword ? "text" : "password"} value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} placeholder={t("currentPassword")} className="rounded-xl pr-10" />
                                <button type="button" onClick={() => setShowOldPassword(!showOldPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                    {showOldPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            <div className="relative">
                                <Input type={showNewPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder={t("newPassword")} className="rounded-xl pr-10" />
                                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            <div className="relative">
                                <Input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder={t("confirmNewPassword")} className="rounded-xl pr-10" />
                                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            <Button onClick={handleChangePassword} disabled={savingPassword || !oldPassword || !newPassword || !confirmPassword} className="w-full rounded-xl">
                                {savingPassword ? t("submitting") : t("changePassword")}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>


            {/* 右列 - 系统配置 */}
            <div className="flex flex-col gap-4">
                <div className="rounded-3xl border border-border bg-card p-6 space-y-5">
                    <h2 className="text-lg font-bold text-card-foreground flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        {t("systemConfig")}
                    </h2>
                    
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Type className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm font-medium">{t("fontSet")}</span>
                        </div>
                        <Input value={config.fontSet} onChange={(e) => updateConfig({ fontSet: e.target.value })} placeholder="e.g. /static/fonts/font.css" className="rounded-xl" />
                        <p className="text-xs text-muted-foreground">{t("fontSetDesc")}</p>
                    </div>
                    
                    <div className="border-t border-border" />
                    
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <UserPlus className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm font-medium">{t("registerIsEnable")}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="registerIsEnable" checked={config.registerIsEnable} onCheckedChange={(checked) => updateConfig({ registerIsEnable: !!checked })} />
                            <Label htmlFor="registerIsEnable" className="text-sm">{config.registerIsEnable ? t("isEnabled") : t("close")}</Label>
                        </div>
                        <p className="text-xs text-muted-foreground">{t("registerIsEnableDesc")}</p>
                    </div>
                    
                    <div className="border-t border-border" />
                    
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Shield className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm font-medium">{t("adminUid")}</span>
                        </div>
                        <Input type="number" value={config.adminUid} onChange={(e) => updateConfig({ adminUid: parseInt(e.target.value) || 0 })} placeholder="e.g. 1" className="rounded-xl" />
                        <p className="text-xs text-muted-foreground">{t("adminUidDesc")}</p>
                    </div>
                    
                    <div className="border-t border-border" />
                    
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <HardDrive className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm font-medium">{t("fileChunkSize")}</span>
                        </div>
                        <Input value={config.fileChunkSize} onChange={(e) => updateConfig({ fileChunkSize: e.target.value })} placeholder="e.g. 1MB, 512KB" className="rounded-xl" />
                        <p className="text-xs text-muted-foreground">{t("fileChunkSizeDesc")}</p>
                    </div>
                    
                    <div className="border-t border-border" />
                    
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Trash2 className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm font-medium">{t("softDeleteRetentionTime")}</span>
                        </div>
                        <Input value={config.softDeleteRetentionTime} onChange={(e) => updateConfig({ softDeleteRetentionTime: e.target.value })} placeholder="e.g. 30d, 24h" className="rounded-xl" />
                        <p className="text-xs text-muted-foreground">{t("softDeleteRetentionTimeDesc")}</p>
                    </div>
                    
                    <div className="border-t border-border" />
                    
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Clock className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm font-medium">{t("uploadSessionTimeout")}</span>
                        </div>
                        <Input value={config.uploadSessionTimeout} onChange={(e) => updateConfig({ uploadSessionTimeout: e.target.value })} placeholder="e.g. 1h, 30m" className="rounded-xl" />
                        <p className="text-xs text-muted-foreground">{t("uploadSessionTimeoutDesc")}</p>
                    </div>
                    
                    <div className="border-t border-border" />
                    
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <GitBranch className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm font-medium">{t("historyKeepVersions")}</span>
                        </div>
                        <Input type="number" min="100" value={config.historyKeepVersions} onChange={(e) => updateConfig({ historyKeepVersions: parseInt(e.target.value) || 100 })} placeholder="e.g. 100" className="rounded-xl" />
                        <p className="text-xs text-muted-foreground">{t("historyKeepVersionsDesc")}</p>
                    </div>
                    
                    <div className="border-t border-border" />
                    
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Clock className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm font-medium">{t("historySaveDelay")}</span>
                        </div>
                        <Input value={config.historySaveDelay} onChange={(e) => updateConfig({ historySaveDelay: e.target.value })} placeholder="e.g. 10s, 1m" className="rounded-xl" />
                        <p className="text-xs text-muted-foreground">{t("historySaveDelayDesc")}</p>
                    </div>
                    
                    <div className="border-t border-border" />
                    
                    <Button onClick={handleSaveConfig} disabled={saving} className="w-full rounded-xl">
                        {saving ? (
                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t("submitting")}</>
                        ) : (
                            <><Save className="h-4 w-4 mr-2" />{t("saveSettings")}</>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}

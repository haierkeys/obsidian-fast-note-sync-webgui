import { Info, GitBranch, Tag, UserPlus, HardDrive, Trash2, Clock, Shield, Loader2, RefreshCw, ExternalLink, CheckCircle, AlertCircle, Type, Lock, Cpu, Server, Activity, Save, Settings } from "lucide-react";
import { useUpdateCheck } from "@/components/api-handle/use-update-check";
import { useSystemInfo } from "@/components/api-handle/use-system-info";
import { useVersion } from "@/components/api-handle/use-version";
import { addCacheBuster } from "@/lib/utils/cache-buster";
import { formatFileSize } from "@/lib/utils/format";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/common/Toast";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { getBrowserLang } from "@/i18n/utils";
import { useState, useEffect } from "react";
import env from "@/env.ts";


interface SystemConfig {
    fontSet: string
    authTokenKey: string
    tokenExpiry: string
    shareTokenKey: string
    shareTokenExpiry: string
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
    const { versionInfo, isLoading: versionLoading } = useVersion()
    const { checkUpdate, isChecking, updateResult } = useUpdateCheck()
    const { systemInfo, isLoading: systemLoading, refresh: refreshSystemInfo } = useSystemInfo()

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

    if (loading) return <div className="p-8 text-center">{t("loading")}</div>
    if (!config) return <div className="p-8 text-center text-destructive">{t("error")}</div>

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-24 md:pb-4">
            {/* 左列 */}
            <div className="flex flex-col gap-4">
                {/* 版本信息 */}
                <div className="rounded-xl border border-border bg-card p-6 space-y-5">
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
                            https://github.com/haierkeys/fast-note-sync-service
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
                        {updateResult || versionInfo?.versionIsNew ? (
                            <div className={`rounded-xl p-4 ${(updateResult?.hasUpdate || versionInfo?.versionIsNew) ? 'bg-primary/10 border border-primary/20' : 'bg-muted/50'}`}>
                                <div className="flex items-start gap-3">
                                    {(updateResult?.hasUpdate || versionInfo?.versionIsNew) ? <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" /> : <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />}
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">{(updateResult?.hasUpdate || versionInfo?.versionIsNew) ? t("newVersionAvailable") : t("alreadyLatest")}</span>
                                            {(updateResult?.latestVersion || versionInfo?.versionNewName) && <code className="text-xs font-mono bg-background px-2 py-0.5 rounded">{updateResult?.latestVersion || versionInfo?.versionNewName}</code>}
                                        </div>
                                        {(updateResult?.hasUpdate || versionInfo?.versionIsNew) && (updateResult?.releaseUrl || versionInfo?.versionNewLink) && (
                                            <a href={updateResult?.releaseUrl || versionInfo?.versionNewLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                                                {t("viewRelease")} <ExternalLink className="h-3 w-3" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>

                {/* 服务器系统信息 */}
                <div className="rounded-xl border border-border bg-card p-6 space-y-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-card-foreground flex items-center gap-2">
                            <Server className="h-5 w-5" />
                            {t("serverSystemInfo")}
                        </h2>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={refreshSystemInfo}
                            disabled={systemLoading}
                            className="h-8 w-8 rounded-full hover:bg-muted"
                        >
                            <RefreshCw className={`h-4 w-4 ${systemLoading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>

                    {systemLoading && !systemInfo ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
                            <span className="text-sm text-muted-foreground">{t("loading")}</span>
                        </div>
                    ) : systemInfo ? (
                        <div className="space-y-8">
                            {/* Service Runtime Info */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-sm font-bold text-primary">
                                    <Activity className="h-4 w-4" />
                                    {t("runtimeInfo")}
                                </div>
                                <div className="grid grid-cols-2 gap-y-2 text-xs">
                                    <div className="text-muted-foreground">{t("goVersion")} / {t("goroutines")} / {t("numGc")}</div>
                                    <div className="text-right font-medium text-[11px] sm:text-xs">
                                        {systemInfo.host.os}/{systemInfo.host.arch}
                                        <span className="text-muted-foreground mx-1.5 opacity-50">|</span>
                                        <span className="font-mono">{systemInfo.runtimeStatus.numGoroutine}</span>
                                        <span className="text-muted-foreground mx-1.5 opacity-50">|</span>
                                        <span className="font-mono">{systemInfo.runtimeStatus.numGc}</span>
                                    </div>

                                    <div className="text-muted-foreground">{t("startTime")} / {t("serviceUptime")}</div>
                                    <div className="text-right text-[11px] font-medium whitespace-nowrap">
                                        <span>{(() => {
                                            const date = new Date(systemInfo.startTime);
                                            const formatted = date.toLocaleString();
                                            const offset = new Intl.DateTimeFormat(undefined, { timeZoneName: 'shortOffset' })
                                                .formatToParts(date)
                                                .find(p => p.type === 'timeZoneName')?.value || "";
                                            return `${formatted} (${offset})`;
                                        })()}</span>
                                        <span className="text-muted-foreground mx-1.5 opacity-50">|</span>
                                        <span className="text-muted-foreground">
                                            {Math.floor(systemInfo.uptime / 3600)}h{Math.floor((systemInfo.uptime % 3600) / 60)}m{Math.floor(systemInfo.uptime % 60)}s
                                        </span>
                                    </div>


                                    <div className="col-span-2 space-y-2 mt-1">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted-foreground">{t("heapMemory")}</span>
                                            <span className="font-medium">
                                                {formatFileSize(systemInfo.runtimeStatus.memAlloc)} / {formatFileSize(systemInfo.runtimeStatus.memSys)}
                                            </span>
                                        </div>
                                        <div className="h-1.5 w-full bg-secondary/50 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary transition-all duration-700 ease-out"
                                                style={{ width: `${Math.min(100, (systemInfo.runtimeStatus.memAlloc / systemInfo.runtimeStatus.memSys) * 100)}%` }}
                                            />
                                        </div>
                                    </div>

                                </div>
                            </div>

                            <div className="border-t border-border/50" />

                            {/* System Hardware Info (Merged CPU, Memory, Host) */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-2 text-sm font-bold text-primary">
                                    <Cpu className="h-4 w-4" />
                                    {t("hostInfo")}
                                </div>

                                {/* Host Details */}
                                <div className="grid grid-cols-2 gap-y-2 text-xs">
                                    <div className="text-muted-foreground">{t("systemTime")}</div>
                                    <div className="text-right font-medium">{(() => {
                                        const date = new Date(systemInfo.host.currentTime);
                                        const formatted = date.toLocaleString();
                                        const offset = new Intl.DateTimeFormat(undefined, { timeZoneName: 'shortOffset' })
                                            .formatToParts(date)
                                            .find(p => p.type === 'timeZoneName')?.value || "";
                                        return `${formatted} (${offset})`;
                                    })()}</div>

                                    <div className="text-muted-foreground">{t("os")} / {t("kernelVersion")}</div>
                                    <div className="text-right font-medium text-[10px] sm:text-xs truncate" title={`${systemInfo.host.osPretty} (${systemInfo.host.kernelVersion})`}>
                                        {systemInfo.host.osPretty}
                                        <span className="text-muted-foreground mx-1.5 opacity-50">|</span>
                                        <span className="font-mono">{systemInfo.host.kernelVersion}</span>
                                    </div>
                                </div>

                                {/* CPU Details */}
                                <div className="space-y-2">
                                    <div className="grid grid-cols-2 gap-y-1.5 text-xs">
                                        <div className="text-muted-foreground">{t("modelName")}</div>
                                        <div className="font-medium truncate text-right" title={systemInfo.cpu.modelName}>{systemInfo.cpu.modelName}</div>

                                        <div className="text-muted-foreground">{t("physicalCores")} / {t("cpuLoad")}</div>
                                        <div className="text-right font-medium">
                                            {systemInfo.cpu.logicalCores}/{systemInfo.cpu.physicalCores}
                                            <span className="text-muted-foreground mx-1.5 opacity-50">|</span>
                                            {systemInfo.cpu.loadAvg.load1.toFixed(2)} {systemInfo.cpu.loadAvg.load5.toFixed(2)} {systemInfo.cpu.loadAvg.load15.toFixed(2)}
                                        </div>
                                    </div>
                                </div>

                                {/* Memory Details */}
                                <div className="space-y-2.5">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted-foreground">{t("memoryUsage")} / {t("usedMemory")} / {t("totalMemory")}</span>
                                            <span className="font-medium">
                                                <span className="font-semibold">{systemInfo.memory.usedPercent.toFixed(1)}%</span>
                                                <span className="text-muted-foreground mx-1.5 opacity-50">|</span>
                                                {formatFileSize(systemInfo.memory.used)} / {formatFileSize(systemInfo.memory.total)}
                                            </span>
                                        </div>
                                        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden shadow-inner">
                                            <div
                                                className={`h-full transition-all duration-700 ease-out fill-mode-forwards ${systemInfo.memory.usedPercent > 85 ? 'bg-destructive' : systemInfo.memory.usedPercent > 65 ? 'bg-orange-500' : 'bg-primary'}`}
                                                style={{ width: `${systemInfo.memory.usedPercent}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 space-y-2">
                            <AlertCircle className="h-8 w-8 text-destructive opacity-50" />
                            <div className="text-sm text-destructive">{t("error")}</div>
                        </div>
                    )}
                </div>
            </div>

            {/* 右列 - 系统配置 */}
            <div className="flex flex-col gap-4">
                <div className="rounded-xl border border-border bg-card p-6 space-y-5 shadow-sm">
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
                        <p className="text-xs text-muted-foreground whitespace-pre-line" dangerouslySetInnerHTML={{ __html: t("fontSetDesc") }} />
                    </div>

                    <div className="border-t border-border" />

                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Lock className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm font-medium">{t("authTokenKey")}</span>
                        </div>
                        <Input value={config.authTokenKey} onChange={(e) => updateConfig({ authTokenKey: e.target.value })} placeholder="e.g. token" className="rounded-xl" />
                        <p className="text-xs text-muted-foreground whitespace-pre-line" dangerouslySetInnerHTML={{ __html: t("authTokenKeyDesc") }} />
                    </div>

                    <div className="border-t border-border" />

                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Clock className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm font-medium">{t("tokenExpiry")}</span>
                        </div>
                        <Input value={config.tokenExpiry} onChange={(e) => updateConfig({ tokenExpiry: e.target.value })} placeholder="e.g. 365d, 24h, 30m" className="rounded-xl" />
                        <p className="text-xs text-muted-foreground whitespace-pre-line" dangerouslySetInnerHTML={{ __html: t("tokenExpiryDesc") }} />
                    </div>

                    <div className="border-t border-border" />

                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Shield className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm font-medium">{t("shareTokenKey")}</span>
                        </div>
                        <Input value={config.shareTokenKey} onChange={(e) => updateConfig({ shareTokenKey: e.target.value })} placeholder="e.g. fns" className="rounded-xl" />
                        <p className="text-xs text-muted-foreground whitespace-pre-line" dangerouslySetInnerHTML={{ __html: t("shareTokenKeyDesc") }} />
                    </div>

                    <div className="border-t border-border" />

                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Clock className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm font-medium">{t("shareTokenExpiry")}</span>
                        </div>
                        <Input value={config.shareTokenExpiry} onChange={(e) => updateConfig({ shareTokenExpiry: e.target.value })} placeholder="e.g. 30d, 24h, 30m" className="rounded-xl" />
                        <p className="text-xs text-muted-foreground whitespace-pre-line" dangerouslySetInnerHTML={{ __html: t("shareTokenExpiryDesc") }} />
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
                        <p className="text-xs text-muted-foreground whitespace-pre-line" dangerouslySetInnerHTML={{ __html: t("registerIsEnableDesc") }} />
                    </div>

                    <div className="border-t border-border" />

                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Shield className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm font-medium">{t("adminUid")}</span>
                        </div>
                        <Input type="number" value={config.adminUid} onChange={(e) => updateConfig({ adminUid: parseInt(e.target.value) || 0 })} placeholder="e.g. 1" className="rounded-xl" />
                        <p className="text-xs text-muted-foreground whitespace-pre-line" dangerouslySetInnerHTML={{ __html: t("adminUidDesc") }} />
                    </div>

                    <div className="border-t border-border" />

                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <HardDrive className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm font-medium">{t("fileChunkSize")}</span>
                        </div>
                        <Input value={config.fileChunkSize} onChange={(e) => updateConfig({ fileChunkSize: e.target.value })} placeholder="e.g. 1MB, 512KB" className="rounded-xl" />
                        <p className="text-xs text-muted-foreground whitespace-pre-line" dangerouslySetInnerHTML={{ __html: t("fileChunkSizeDesc") }} />
                    </div>

                    <div className="border-t border-border" />

                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Trash2 className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm font-medium">{t("softDeleteRetentionTime")}</span>
                        </div>
                        <Input value={config.softDeleteRetentionTime} onChange={(e) => updateConfig({ softDeleteRetentionTime: e.target.value })} placeholder="e.g. 30d, 24h" className="rounded-xl" />
                        <p className="text-xs text-muted-foreground whitespace-pre-line" dangerouslySetInnerHTML={{ __html: t("softDeleteRetentionTimeDesc") }} />
                    </div>

                    <div className="border-t border-border" />

                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Clock className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm font-medium">{t("uploadSessionTimeout")}</span>
                        </div>
                        <Input value={config.uploadSessionTimeout} onChange={(e) => updateConfig({ uploadSessionTimeout: e.target.value })} placeholder="e.g. 1h, 30m" className="rounded-xl" />
                        <p className="text-xs text-muted-foreground whitespace-pre-line" dangerouslySetInnerHTML={{ __html: t("uploadSessionTimeoutDesc") }} />
                    </div>

                    <div className="border-t border-border" />

                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <GitBranch className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm font-medium">{t("historyKeepVersions")}</span>
                        </div>
                        <Input type="number" min="100" value={config.historyKeepVersions} onChange={(e) => updateConfig({ historyKeepVersions: parseInt(e.target.value) || 100 })} placeholder="e.g. 100" className="rounded-xl" />
                        <p className="text-xs text-muted-foreground whitespace-pre-line" dangerouslySetInnerHTML={{ __html: t("historyKeepVersionsDesc") }} />
                    </div>

                    <div className="border-t border-border" />

                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Clock className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm font-medium">{t("historySaveDelay")}</span>
                        </div>
                        <Input value={config.historySaveDelay} onChange={(e) => updateConfig({ historySaveDelay: e.target.value })} placeholder="e.g. 10s, 1m" className="rounded-xl" />
                        <p className="text-xs text-muted-foreground whitespace-pre-line" dangerouslySetInnerHTML={{ __html: t("historySaveDelayDesc") }} />
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

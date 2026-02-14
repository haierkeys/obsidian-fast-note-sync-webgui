import { addCacheBuster } from "@/lib/utils/cache-buster";
import { useState, useEffect, useCallback } from "react";
import { getBrowserLang } from "@/lib/i18n/utils";
import env from "@/env.ts";


export interface LoadInfo {
    load1: number;
    load5: number;
    load15: number;
}

export interface CPUInfo {
    modelName: string;
    physicalCores: number;
    logicalCores: number;
    percent: number[];
    loadAvg: LoadInfo;
}

export interface MemoryInfo {
    total: number;
    used: number;
    available: number;
    usedPercent: number;
    swapTotal: number;
    swapUsed: number;
    swapUsedPercent: number;
}

export interface HostInfo {
    hostname: string;
    uptime: number;
    os: string;
    platform: string;
    osPretty: string;
    kernelVersion: string;
    arch: string;
    timezone: string;
    currentTime: string;
}

export interface ProcessInfo {
    pid: number;
    ppid: number;
    name: string;
    cpuPercent: number;
    memoryPercent: number;
}

export interface RuntimeInfo {
    memAlloc: number;
    memTotal: number;
    memSys: number;
    numGc: number;
    numGoroutine: number;
}

export interface SystemInfo {
    cpu: CPUInfo;
    memory: MemoryInfo;
    host: HostInfo;
    process: ProcessInfo;
    runtimeStatus: RuntimeInfo;
    startTime: string;
    uptime: number;
}

export function useSystemInfo() {
    const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const token = localStorage.getItem("token");

    const fetchSystemInfo = useCallback(async () => {
        if (!token) return;
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(addCacheBuster(env.API_URL + "/api/admin/systeminfo"), {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                    Lang: getBrowserLang(),
                },
            });

            if (!response.ok) {
                throw new Error("Network response was not ok");
            }

            const res = await response.json();
            if (res.code === 0 || (res.code < 100 && res.code > 0)) {
                setSystemInfo(res.data);
            } else {
                setError(res.message || "Failed to get system info");
            }
        } catch (error) {
            setError("Failed to get system info");
            console.error("System info fetch error:", error);
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchSystemInfo();
    }, [fetchSystemInfo]);

    return {
        systemInfo,
        isLoading,
        error,
        refresh: fetchSystemInfo
    };
}

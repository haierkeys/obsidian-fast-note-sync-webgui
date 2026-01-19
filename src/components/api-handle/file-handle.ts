import { File, FileListResponse } from "@/lib/types/file";
import { addCacheBuster } from "@/lib/utils/cache-buster";
import { toast } from "@/components/common/Toast";
import { getBrowserLang } from "@/lib/i18n/utils";
import { useCallback, useMemo } from "react";
import env from "@/env.ts";


/**
 * 附件 API 处理 Hook
 * 提供附件列表查询和删除功能
 */
export function useFileHandle() {
    const getHeaders = useCallback(() => {
        const currentToken = localStorage.getItem("token") || "";
        return {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${currentToken}`,
            Domain: window.location.origin,
            Lang: getBrowserLang(),
        };
    }, []);

    /**
     * 获取附件列表
     * @param vault 仓库名称
     * @param isRecycle 是否为回收站
     * @param keyword 搜索关键词
     * @param sortBy 排序字段: mtime(默认), ctime, path
     * @param sortOrder 排序方向: desc(默认), asc
     * @param callback 成功回调
     */
    const handleFileList = useCallback(async (
        vault: string,
        isRecycle: boolean = false,
        keyword: string = "",
        sortBy: string = "mtime",
        sortOrder: string = "desc",
        callback: (data: FileListResponse) => void
    ) => {
        try {
            const apiUrl = env.API_URL.endsWith("/") ? env.API_URL.slice(0, -1) : env.API_URL;
            let url = `${apiUrl}/api/files?vault=${vault}`;

            if (isRecycle) {
                url += `&isRecycle=1`;
            }
            if (keyword) {
                url += `&keyword=${encodeURIComponent(keyword)}`;
            }
            if (sortBy && sortBy !== "mtime") {
                url += `&sortBy=${sortBy}`;
            }
            if (sortOrder && sortOrder !== "desc") {
                url += `&sortOrder=${sortOrder}`;
            }

            const response = await fetch(addCacheBuster(url), {
                method: "GET",
                headers: getHeaders(),
            });

            if (!response.ok) {
                throw new Error("Network response was not ok");
            }

            const res: { code: number; message: string; data?: { list: File[] } | File[] } = await response.json();

            if (res.code > 0 && res.code <= 200) {
                let fileList: File[] = [];
                if (Array.isArray(res.data)) {
                    fileList = res.data;
                } else if (res.data && 'list' in res.data && Array.isArray(res.data.list)) {
                    fileList = res.data.list;
                }

                callback({ list: fileList });
            } else {
                toast.error(res.message);
            }
        } catch (error: unknown) {
            console.error("handleFileList error:", error);
            toast.error(error instanceof Error ? error.message : String(error));
        }
    }, [getHeaders]);

    /**
     * 删除附件
     * @param vault 仓库名称
     * @param path 文件路径
     * @param pathHash 路径哈希值
     * @param callback 成功回调
     */
    const handleDeleteFile = useCallback(async (
        vault: string,
        path: string,
        pathHash: string | undefined,
        callback: () => void
    ) => {
        try {
            const body = {
                vault,
                path,
                pathHash,
            };
            const apiUrl = env.API_URL.endsWith("/") ? env.API_URL.slice(0, -1) : env.API_URL;
            const response = await fetch(addCacheBuster(`${apiUrl}/api/file`), {
                method: "DELETE",
                body: JSON.stringify(body),
                headers: getHeaders(),
            });

            if (!response.ok) {
                throw new Error("Network response was not ok");
            }

            const res: { code: number; message: string; details?: string[] } = await response.json();

            if (res.code > 0 && res.code <= 200) {
                toast.success(res.message);
                callback();
            } else {
                toast.error(res.message + (res.details ? ": " + res.details.join(", ") : ""));
            }
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : String(error));
        }
    }, [getHeaders]);

    /**
     * 恢复附件
     * @param vault 仓库名称
     * @param path 文件路径
     * @param pathHash 路径哈希值
     * @param callback 成功回调
     */
    const handleRestoreFile = useCallback(async (
        vault: string,
        path: string,
        pathHash: string | undefined,
        callback: () => void
    ) => {
        try {
            const body = {
                vault,
                path,
                pathHash,
            };
            const apiUrl = env.API_URL.endsWith("/") ? env.API_URL.slice(0, -1) : env.API_URL;
            const response = await fetch(addCacheBuster(`${apiUrl}/api/file/restore`), {
                method: "PUT",
                body: JSON.stringify(body),
                headers: getHeaders(),
            });

            if (!response.ok) {
                throw new Error("Network response was not ok");
            }

            const res: { code: number; message: string; details?: string[] } = await response.json();

            if (res.code > 0 && res.code <= 200) {
                toast.success(res.message);
                callback();
            } else {
                toast.error(res.message + (res.details ? ": " + res.details.join(", ") : ""));
            }
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : String(error));
        }
    }, [getHeaders]);

    /**
     * 获取文件原始内容 URL (带 token)
     */
    const getRawFileUrl = useCallback((vault: string, path: string, pathHash?: string) => {
        const apiUrl = env.API_URL.endsWith("/") ? env.API_URL.slice(0, -1) : env.API_URL;
        const currentToken = localStorage.getItem("token") || "";
        let url = `${apiUrl}/api/file?vault=${encodeURIComponent(vault)}&path=${encodeURIComponent(path)}&token=${encodeURIComponent(currentToken)}`;
        if (pathHash) {
            url += `&pathHash=${pathHash}`;
        }
        return url;
    }, []);

    return useMemo(() => ({
        handleFileList,
        handleDeleteFile,
        handleRestoreFile,
        getRawFileUrl,
    }), [
        handleFileList,
        handleDeleteFile,
        handleRestoreFile,
        getRawFileUrl,
    ]);
}

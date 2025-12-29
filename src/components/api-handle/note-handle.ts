import { Note, NoteDetail, NoteResponse, NoteHistoryDetail, NoteHistoryListResponse } from "@/lib/types/note";
import { useConfirmDialog } from "@/components/context/confirm-dialog-context";
import { addCacheBuster } from "@/lib/utils/cache-buster";
import { getBrowserLang } from "@/lib/i18n/utils";
import { useCallback, useMemo } from "react";
import env from "@/env.ts";


export function useNoteHandle() {
    const { openConfirmDialog } = useConfirmDialog()
    const token = localStorage.getItem("token")!

    const getHeaders = useCallback(() => ({
        "Content-Type": "application/json",
        Domain: window.location.origin,
        Token: token,
        Lang: getBrowserLang(),
    }), [token])

    const handleNoteList = useCallback(async (vault: string, page: number, pageSize: number, keyword: string = "", callback: (data: { list: Note[], pager: { page: number, pageSize: number, totalRows: number } }) => void) => {
        try {
            // Ensure page and pageSize are integers strings
            const pageStr = Math.floor(page).toString();
            const pageSizeStr = Math.floor(pageSize).toString();

            let url = `${env.API_URL}/api/notes?vault=${vault}&page=${pageStr}&pageSize=${pageSizeStr}`;
            if (keyword) {
                url += `&keyword=${encodeURIComponent(keyword)}`;
            }

            const response = await fetch(addCacheBuster(url), {
                method: "GET",
                headers: getHeaders(),
            })
            if (!response.ok) {
                throw new Error("Network response was not ok")
            }
            const res: NoteResponse<{ list: Note[], pager: { page: number, pageSize: number, totalRows: number } }> = await response.json()
            if (res.code > 0 && res.code <= 200) {
                const data = res.data || { list: [], pager: { page: 1, pageSize: pageSize, totalRows: 0 } };
                if (!data.list) data.list = [];
                callback(data)
            } else {
                openConfirmDialog(res.message, "error")
            }
        } catch (error: unknown) {
            openConfirmDialog(error instanceof Error ? error.message : String(error), "error")
        }
    }, [getHeaders, openConfirmDialog])

    const handleGetNote = useCallback(async (vault: string, path: string, callback: (note: NoteDetail) => void) => {
        try {
            const response = await fetch(addCacheBuster(`${env.API_URL}/api/note?vault=${vault}&path=${encodeURIComponent(path)}`), {
                method: "GET",
                headers: getHeaders(),
            })
            if (!response.ok) {
                throw new Error("Network response was not ok")
            }
            const res: NoteResponse<NoteDetail> = await response.json()
            if (res.code > 0 && res.code <= 200 && res.data) {
                callback(res.data)
            } else if (res.code > 0 && res.code <= 200) {
                // handle empty data
                console.warn("GetNote returned 200 but data is null");
            } else {
                openConfirmDialog(res.message, "error")
            }
        } catch (error: unknown) {
            openConfirmDialog(error instanceof Error ? error.message : String(error), "error")
        }
    }, [getHeaders, openConfirmDialog])

    const handleSaveNote = useCallback(async (
        vault: string,
        path: string,
        content: string,
        options: { pathHash?: string; srcPath?: string; srcPathHash?: string; contentHash?: string } = {},
        callback: () => void
    ) => {
        try {
            const body = {
                vault,
                path,
                content,
                ...options,
            }
            const response = await fetch(addCacheBuster(`${env.API_URL}/api/note`), {
                method: "POST",
                body: JSON.stringify(body),
                headers: getHeaders(),
            })
            if (!response.ok) {
                throw new Error("Network response was not ok")
            }
            const res: NoteResponse<unknown> = await response.json()
            if (res.code > 0 && res.code <= 200) {
                openConfirmDialog(res.message, "success")
                callback()
            } else {
                openConfirmDialog(res.message + (res.details ? ": " + res.details.join(", ") : ""), "error")
            }
        } catch (error: unknown) {
            openConfirmDialog(error instanceof Error ? error.message : String(error), "error")
        }
    }, [getHeaders, openConfirmDialog])

    const handleDeleteNote = useCallback(async (vault: string, path: string, pathHash: string | undefined, callback: () => void) => {
        try {
            const body = {
                vault,
                path,
                pathHash,
            }
            const response = await fetch(addCacheBuster(`${env.API_URL}/api/note`), {
                method: "DELETE",
                body: JSON.stringify(body),
                headers: getHeaders(),
            })
            if (!response.ok) {
                throw new Error("Network response was not ok")
            }
            const res: NoteResponse<unknown> = await response.json()
            if (res.code > 0 && res.code <= 200) {
                openConfirmDialog(res.message, "success")
                callback()
            } else {
                openConfirmDialog(res.message + (res.details ? ": " + res.details.join(", ") : ""), "error")
            }
        } catch (error: unknown) {
            openConfirmDialog(error instanceof Error ? error.message : String(error), "error")
        }
    }, [getHeaders, openConfirmDialog])

    const handleNoteHistoryList = useCallback(async (vault: string, notePath: string, pathHash: string | undefined, page: number, pageSize: number, callback: (data: NoteHistoryListResponse) => void) => {
        try {
            const pageStr = Math.floor(page).toString();
            const pageSizeStr = Math.floor(pageSize).toString();
            let url = `${env.API_URL}/api/note/histories?vault=${vault}&path=${encodeURIComponent(notePath)}&page=${pageStr}&pageSize=${pageSizeStr}`;
            if (pathHash) {
                url += `&path_hash=${pathHash}`;
            }
            const response = await fetch(addCacheBuster(url), {
                method: "GET",
                headers: getHeaders(),
            })
            if (!response.ok) {
                throw new Error("Network response was not ok")
            }
            const res: NoteResponse<NoteHistoryListResponse> = await response.json()
            if (res.code > 0 && res.code <= 200) {
                const data = res.data || { list: [], pager: { page: 1, pageSize: pageSize, totalRows: 0 } };
                if (!data.list) data.list = [];
                callback(data)
            } else {
                openConfirmDialog(res.message, "error")
            }
        } catch (error: unknown) {
            openConfirmDialog(error instanceof Error ? error.message : String(error), "error")
        }
    }, [getHeaders, openConfirmDialog])

    const handleNoteHistoryDetail = useCallback(async (vault: string, id: number, callback: (data: NoteHistoryDetail) => void) => {
        try {
            const response = await fetch(addCacheBuster(`${env.API_URL}/api/note/history?vault=${vault}&id=${id}`), {
                method: "GET",
                headers: getHeaders(),
            })
            if (!response.ok) {
                throw new Error("Network response was not ok")
            }
            const res: NoteResponse<NoteHistoryDetail> = await response.json()
            if (res.code > 0 && res.code <= 200 && res.data) {
                callback(res.data)
            } else {
                openConfirmDialog(res.message, "error")
            }
        } catch (error: unknown) {
            openConfirmDialog(error instanceof Error ? error.message : String(error), "error")
        }
    }, [getHeaders, openConfirmDialog])

    return useMemo(() => ({
        handleNoteList,
        handleGetNote,
        handleSaveNote,
        handleDeleteNote,
        handleNoteHistoryList,
        handleNoteHistoryDetail,
    }), [
        handleNoteList,
        handleGetNote,
        handleSaveNote,
        handleDeleteNote,
        handleNoteHistoryList,
        handleNoteHistoryDetail,
    ])
}

import { useConfirmDialog } from "@/components/context/confirm-dialog-context";
import { Note, NoteDetail, NoteResponse } from "@/lib/types/note";
import { addCacheBuster } from "@/lib/utils/cache-buster";
import { getBrowserLang } from "@/lib/i18n/utils";
import env from "@/env.ts";


export function useNoteHandle() {
    const { openConfirmDialog } = useConfirmDialog()
    const token = localStorage.getItem("token")!

    const getHeaders = () => ({
        "Content-Type": "application/json",
        Domain: window.location.origin,
        Token: token,
        Lang: getBrowserLang(),
    })

    const handleNoteList = async (vault: string, page: number, pageSize: number, callback: (data: { list: Note[], pager: { page: number, pageSize: number, totalRows: number } }) => void) => {
        try {
            // Ensure page and pageSize are integers strings
            const pageStr = Math.floor(page).toString();
            const pageSizeStr = Math.floor(pageSize).toString();

            const response = await fetch(addCacheBuster(`${env.API_URL}/api/notes?vault=${vault}&page=${pageStr}&pageSize=${pageSizeStr}`), {
                method: "GET",
                headers: getHeaders(),
            })
            if (!response.ok) {
                throw new Error("Network response was not ok")
            }
            const res: NoteResponse<{ list: Note[], pager: { page: number, pageSize: number, totalRows: number } }> = await response.json()
            if (res.code > 0 && res.code <= 200) {
                callback(res.data)
            } else {
                openConfirmDialog(res.message, "error")
            }
        } catch (error: any) {
            openConfirmDialog(error.message, "error")
        }
    }

    const handleGetNote = async (vault: string, path: string, callback: (note: NoteDetail) => void) => {
        try {
            const response = await fetch(addCacheBuster(`${env.API_URL}/api/note?vault=${vault}&path=${encodeURIComponent(path)}`), {
                method: "GET",
                headers: getHeaders(),
            })
            if (!response.ok) {
                throw new Error("Network response was not ok")
            }
            const res: NoteResponse<NoteDetail> = await response.json()
            if (res.code > 0 && res.code <= 200) {
                callback(res.data)
            } else {
                openConfirmDialog(res.message, "error")
            }
        } catch (error: any) {
            openConfirmDialog(error.message, "error")
        }
    }

    const handleSaveNote = async (
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
            const res: NoteResponse<any> = await response.json()
            if (res.code > 0 && res.code <= 200) {
                openConfirmDialog(res.message, "success")
                callback()
            } else {
                openConfirmDialog(res.message + (res.details ? ": " + res.details.join(", ") : ""), "error")
            }
        } catch (error: any) {
            openConfirmDialog(error.message, "error")
        }
    }

    const handleDeleteNote = async (vault: string, path: string, pathHash: string | undefined, callback: () => void) => {
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
            const res: NoteResponse<any> = await response.json()
            if (res.code > 0 && res.code <= 200) {
                openConfirmDialog(res.message, "success")
                callback()
            } else {
                openConfirmDialog(res.message + (res.details ? ": " + res.details.join(", ") : ""), "error")
            }
        } catch (error: any) {
            openConfirmDialog(error.message, "error")
        }
    }

    return {
        handleNoteList,
        handleGetNote,
        handleSaveNote,
        handleDeleteNote,
    }
}

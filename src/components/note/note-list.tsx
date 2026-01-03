import { FileText, Trash2, RefreshCw, Plus, Eye, Pencil, Calendar, Clock, ChevronLeft, ChevronRight, History, Search, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useConfirmDialog } from "@/components/context/confirm-dialog-context";
import { useNoteHandle } from "@/components/api-handle/note-handle";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { VaultType } from "@/lib/types/vault";
import { Input } from "@/components/ui/input";
import { Note } from "@/lib/types/note";
import { format } from "date-fns";


interface NoteListProps {
    vault: string;
    vaults?: VaultType[];
    onVaultChange?: (vault: string) => void;
    onSelectNote: (note: Note, mode: "view" | "edit") => void;
    onCreateNote: () => void;
    page: number;
    setPage: (page: number) => void;
    pageSize: number;
    setPageSize: (pageSize: number) => void;
    onViewHistory: (note: Note) => void;
    isRecycle?: boolean;
}

export function NoteList({ vault, vaults, onVaultChange, onSelectNote, onCreateNote, page, setPage, pageSize, setPageSize, onViewHistory, isRecycle = false }: NoteListProps) {
    const { t } = useTranslation();
    const { handleNoteList, handleDeleteNote } = useNoteHandle();
    const { openConfirmDialog } = useConfirmDialog();
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(false);
    const [totalRows, setTotalRows] = useState(0);
    const [searchKeyword, setSearchKeyword] = useState("");
    const [debouncedKeyword, setDebouncedKeyword] = useState("");

    // Debounce search keyword
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedKeyword(searchKeyword);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchKeyword]);

    const fetchNotes = (currentPage: number = page, currentPageSize: number = pageSize, keyword: string = debouncedKeyword) => {
        setLoading(true);
        handleNoteList(vault, currentPage, currentPageSize, keyword, isRecycle, (data) => {
            if (data) {
                setNotes(data.list || []);
                setTotalRows(data.pager?.totalRows || 0);
            } else {
                setNotes([]);
                setTotalRows(0);
            }
            setLoading(false);
        });
    };

    useEffect(() => {
        fetchNotes(page, pageSize, debouncedKeyword);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [vault, page, pageSize, debouncedKeyword, isRecycle]);

    // Reset page to 1 when search keyword changes
    useEffect(() => {
        setPage(1);
    }, [debouncedKeyword, setPage]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= Math.ceil(totalRows / pageSize)) {
            setPage(newPage);
            // fetchNotes(newPage); // useEffect will handle this
        }
    };

    const onDelete = (e: React.MouseEvent, note: Note) => {
        e.stopPropagation();
        const title = note.path.replace(/\.md$/, "");
        openConfirmDialog(t("deleteNoteConfirm", { title }), "confirm", () => {
            handleDeleteNote(vault, note.path, note.pathHash, () => {
                fetchNotes();
            });
        });
    };

    const totalPages = Math.ceil(totalRows / pageSize);

    return (
        <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center space-x-4">
                    {vaults && onVaultChange ? (
                        <Select value={vault} onValueChange={onVaultChange}>
                            <SelectTrigger className="w-auto min-w-[220px] font-medium">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold"><SelectValue placeholder="Select Vault" /></span>
                                    <span className="text-muted-foreground">/</span>
                                    <span className="font-bold">{isRecycle ? t("menuTrash") + t("note") : t("notes")}</span>
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                {vaults.map((v) => (
                                    <SelectItem key={v.id} value={v.vault}>
                                        {v.vault}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ) : (
                        <CardTitle className="text-xl font-bold">
                            {isRecycle ? t("menuTrash") + t("note") : t("notes")} ({totalRows})
                        </CardTitle>
                    )}
                </div>
                <div className="flex items-center space-x-2 flex-1 max-w-sm px-4">
                    <div className="relative w-full">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                            type="text"
                            placeholder={t("searchPlaceholder")}
                            className="pl-9 pr-8 h-9"
                            value={searchKeyword}
                            onChange={(e) => setSearchKeyword(e.target.value)}
                        />
                        {searchKeyword && (
                            <button
                                className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                                onClick={() => setSearchKeyword("")}
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </div>
                <div className="flex space-x-2">
                    <Button variant="outline" size="icon" onClick={() => fetchNotes()} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    </Button>
                    {!isRecycle && (
                        <Button onClick={onCreateNote}>
                            <Plus className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">{t("newNote")}</span>
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="pb-6 pt-2">
                    {!Array.isArray(notes) || notes.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">{t("noNotes")}</div>
                    ) : (
                        <>
                            <div className="border-t border-b border-gray-200 divide-y divide-gray-200">
                                {notes.map((note, index) => (
                                    <div
                                        key={note.id}
                                        className={`flex items-start justify-between px-6 py-3 cursor-pointer transition-colors ${index % 2 === 0 ? "bg-white" : "bg-gray-50"
                                            } hover:bg-blue-50`}
                                        onClick={() => onSelectNote(note, "view")}
                                    >
                                        <div className="flex items-start space-x-4 overflow-hidden">
                                            <FileText className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                            <div className="flex flex-col overflow-hidden">
                                                <span className="font-medium text-base break-all whitespace-normal">{note.path.replace(/\.md$/, "")}</span>
                                                <div className="flex items-center sm:space-x-3 text-xs text-gray-400 mt-1">
                                                    <span className="hidden sm:flex items-center" title={t("createdAt")}>
                                                        <Calendar className="mr-1 h-3 w-3" />
                                                        {format(new Date(note.ctime), "yyyy-MM-dd HH:mm")}
                                                    </span>
                                                    <span className="flex items-center" title={t("updatedAt")}>
                                                        <Clock className="mr-1 h-3 w-3" />
                                                        {format(new Date(note.mtime), "yyyy-MM-dd HH:mm")}
                                                    </span>
                                                    {note.version > 0 && (
                                                        <span className="flex items-center text-gray-400" title={t("history")}>
                                                            <History className="mr-1 h-3 w-3" />
                                                            v{note.version}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-gray-500 hover:text-blue-600 hover:bg-blue-50 hidden sm:inline-flex"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onSelectNote(note, "view");
                                                }}
                                                title={t("view")}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            {!isRecycle && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-gray-500 hover:text-green-600 hover:bg-green-50 hidden sm:inline-flex"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onSelectNote(note, "edit");
                                                    }}
                                                    title={t("edit")}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-gray-500 hover:text-purple-600 hover:bg-purple-50"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onViewHistory(note);
                                                }}
                                                title={t("history") || "历史记录"}
                                            >
                                                <History className="h-4 w-4" />
                                            </Button>
                                            {!isRecycle && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50"
                                                    onClick={(e) => onDelete(e, note)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {/* Pagination Controls */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between px-6 py-4 gap-4 sm:gap-0">
                                <div className="flex items-center space-x-2 text-sm text-gray-500">
                                    <span>{t("of")} {totalRows} {t("results")}</span>
                                    <Select value={pageSize.toString()} onValueChange={(val) => {
                                        const newSize = parseInt(val);
                                        setPageSize(newSize);
                                        setPage(1);
                                        // fetchNotes(1, newSize); // useEffect will handle this
                                    }}>
                                        <SelectTrigger className="h-8 w-[110px]">
                                            <SelectValue placeholder={pageSize.toString()} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {[10, 20, 50, 100].map((size) => (
                                                <SelectItem key={size} value={size.toString()}>
                                                    {size} {t("perPage")}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(page - 1)}
                                        disabled={page === 1 || loading}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        {t("previous")}
                                    </Button>
                                    <div className="text-sm font-medium">
                                        {t("page")} {page} {t("of")} {totalPages}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(page + 1)}
                                        disabled={page === totalPages || loading}
                                    >
                                        {t("next")}
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

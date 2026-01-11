import { FileText, Trash2, RefreshCw, Plus, Calendar, Clock, ChevronLeft, ChevronRight, History, Search, X, Regex, FileSearch, ArrowUpDown, RotateCcw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useConfirmDialog } from "@/components/context/confirm-dialog-context";
import { useNoteHandle } from "@/components/api-handle/note-handle";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next";
import { VaultType } from "@/lib/types/vault";
import { Input } from "@/components/ui/input";
import { Note } from "@/lib/types/note";
import { format } from "date-fns";

type SearchMode = "path" | "content" | "regex";
type SortBy = "mtime" | "ctime" | "path";
type SortOrder = "desc" | "asc";

interface NoteListProps {
    vault: string;
    vaults?: VaultType[];
    onVaultChange?: (vault: string) => void;
    onSelectNote: (note: Note) => void;
    onCreateNote: () => void;
    page: number;
    setPage: (page: number) => void;
    pageSize: number;
    setPageSize: (pageSize: number) => void;
    onViewHistory: (note: Note) => void;
    isRecycle?: boolean;
    searchKeyword: string;
    setSearchKeyword: (keyword: string) => void;
}

export function NoteList({ vault, vaults, onVaultChange, onSelectNote, onCreateNote, page, setPage, pageSize, setPageSize, onViewHistory, isRecycle = false, searchKeyword, setSearchKeyword }: NoteListProps) {
    const { t } = useTranslation();
    const { handleNoteList, handleDeleteNote, handleRestoreNote } = useNoteHandle();
    const { openConfirmDialog } = useConfirmDialog();
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(false);
    const [totalRows, setTotalRows] = useState(0);
    const [debouncedKeyword, setDebouncedKeyword] = useState(searchKeyword);
    const [searchMode, setSearchMode] = useState<SearchMode>("path");
    const [regexError, setRegexError] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<SortBy>("mtime");
    const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

    // Debounce search keyword
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedKeyword(searchKeyword);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchKeyword]);

    // 验证正则表达式
    useEffect(() => {
        if (searchMode === "regex" && searchKeyword) {
            try {
                new RegExp(searchKeyword);
                setRegexError(null);
            } catch {
                setRegexError(t("invalidRegex") || "Invalid regex");
            }
        } else {
            setRegexError(null);
        }
    }, [searchKeyword, searchMode, t]);

    const fetchNotes = (currentPage: number = page, currentPageSize: number = pageSize, keyword: string = debouncedKeyword) => {
        // 如果是正则模式且有错误，不发起请求
        if (searchMode === "regex" && regexError) return;
        
        setLoading(true);
        handleNoteList(vault, currentPage, currentPageSize, keyword, isRecycle, searchMode, false, sortBy, sortOrder, (data) => {
            let filteredList = data?.list || [];
            
            // 前端正则过滤（因为后端使用 LIKE 作为后备）
            if (searchMode === "regex" && keyword && filteredList.length > 0) {
                try {
                    const regex = new RegExp(keyword, "i");
                    filteredList = filteredList.filter(note => regex.test(note.path));
                } catch {
                    // 正则无效时不过滤
                }
            }
            
            setNotes(filteredList);
            setTotalRows(data?.pager?.totalRows || 0);
            setLoading(false);
        });
    };

    useEffect(() => {
        fetchNotes(page, pageSize, debouncedKeyword);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [vault, page, pageSize, debouncedKeyword, isRecycle, searchMode, sortBy, sortOrder]);

    // Reset page to 1 when search keyword changes
    useEffect(() => {
        setPage(1);
    }, [debouncedKeyword, setPage]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= Math.ceil(totalRows / pageSize)) {
            setPage(newPage);
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

    const onRestore = (e: React.MouseEvent, note: Note) => {
        e.stopPropagation();
        const title = note.path.replace(/\.md$/, "");
        openConfirmDialog(t("restoreNoteConfirm", { title }), "confirm", () => {
            handleRestoreNote(vault, note.path, note.pathHash, () => {
                fetchNotes();
            });
        });
    };

    const totalPages = Math.ceil(totalRows / pageSize);

    return (
        <div className="w-full h-full flex flex-col min-h-0 space-y-4">
            {/* 工具栏 */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-1">
                {/* 左侧：仓库选择 */}
                <div className="flex items-center gap-3">
                    {vaults && onVaultChange && (
                        <Select value={vault} onValueChange={onVaultChange}>
                            <SelectTrigger className="w-auto min-w-[180px] rounded-xl">
                                <SelectValue placeholder="Select Vault" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                {vaults.map((v) => (
                                    <SelectItem key={v.id} value={v.vault} className="rounded-xl">
                                        {v.vault}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                    <span className="text-sm text-muted-foreground">
                        {totalRows} {isRecycle ? t("menuTrash") : ""}{t("note")}
                    </span>
                </div>

                {/* 右侧：搜索和操作 */}
                <div className="flex flex-col gap-2 w-full sm:w-auto">
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1 sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            <Input
                                type="text"
                                placeholder={t("searchPlaceholder")}
                                className={`pl-9 pr-8 rounded-xl ${regexError ? "border-destructive" : ""}`}
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                            />
                            {searchKeyword && (
                                <button
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    onClick={() => setSearchKeyword("")}
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                        <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => fetchNotes()} 
                            disabled={loading}
                            className="rounded-xl shrink-0"
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                        </Button>
                        {!isRecycle && (
                            <Button onClick={onCreateNote} className="rounded-xl shrink-0">
                                <Plus className="h-4 w-4 sm:mr-2" />
                                <span className="hidden sm:inline">{t("newNote")}</span>
                            </Button>
                        )}
                    </div>
                    {/* 搜索模式 + 排序 */}
                    <div className="flex items-center gap-3 flex-wrap">
                        {/* 搜索模式切换 */}
                        <div className="flex items-center h-8 rounded-xl border border-border overflow-hidden">
                            <button
                                className={`px-3 h-full text-xs flex items-center gap-1.5 transition-colors ${searchMode === "path" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                                onClick={() => setSearchMode("path")}
                            >
                                <Search className="h-3.5 w-3.5" />
                                {t("searchPath")}
                            </button>
                            <button
                                className={`px-3 h-full text-xs flex items-center gap-1.5 transition-colors border-l border-border ${searchMode === "content" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                                onClick={() => setSearchMode("content")}
                            >
                                <FileSearch className="h-3.5 w-3.5" />
                                {t("searchContentMode")}
                            </button>
                            <button
                                className={`px-3 h-full text-xs flex items-center gap-1.5 transition-colors border-l border-border ${searchMode === "regex" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                                onClick={() => setSearchMode("regex")}
                            >
                                <Regex className="h-3.5 w-3.5" />
                                {t("searchRegex")}
                            </button>
                        </div>
                        {/* 排序选择 */}
                        <div className="flex items-center h-8 rounded-xl border border-border overflow-hidden">
                            <button
                                className={`px-3 h-full text-xs flex items-center gap-1.5 transition-colors ${sortBy === "mtime" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                                onClick={() => setSortBy("mtime")}
                            >
                                <Clock className="h-3.5 w-3.5" />
                                {t("sortByMtime")}
                            </button>
                            <button
                                className={`px-3 h-full text-xs flex items-center gap-1.5 transition-colors border-l border-border ${sortBy === "ctime" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                                onClick={() => setSortBy("ctime")}
                            >
                                <Calendar className="h-3.5 w-3.5" />
                                {t("sortByCtime")}
                            </button>
                            <button
                                className={`px-3 h-full text-xs flex items-center gap-1.5 transition-colors border-l border-border ${sortBy === "path" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                                onClick={() => setSortBy("path")}
                            >
                                <FileText className="h-3.5 w-3.5" />
                                {t("sortByPath")}
                            </button>
                            <Tooltip content={sortOrder === "desc" ? t("sortDesc") : t("sortAsc")} side="top" delay={200}>
                                <button
                                    className={`px-2.5 h-full text-xs flex items-center transition-colors border-l border-border hover:bg-muted`}
                                    onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
                                >
                                    <ArrowUpDown className={`h-3.5 w-3.5 transition-transform ${sortOrder === "asc" ? "rotate-180" : ""}`} />
                                </button>
                            </Tooltip>
                        </div>
                        {regexError && (
                            <span className="text-xs text-destructive">{regexError}</span>
                        )}
                    </div>
                </div>
            </div>

            {/* 笔记列表 */}
            {loading ? (
                <div className="rounded-3xl border border-border bg-card p-12 text-center text-muted-foreground">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                    {t("loading") || "加载中..."}
                </div>
            ) : !Array.isArray(notes) || notes.length === 0 ? (
                <div className="rounded-3xl border border-border bg-card p-12 text-center text-muted-foreground">
                    {t("noNotes")}
                </div>
            ) : (
                <div className="flex-1 min-h-0 overflow-y-auto -mx-2 px-2">
                    <div className="grid grid-cols-1 gap-3 py-1">
                    {notes.map((note) => (
                        <article
                            key={note.id}
                            className="rounded-3xl border border-border bg-card p-4 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/30"
                            onClick={() => onSelectNote(note)}
                        >
                                <div className="flex items-center justify-between gap-4">
                                    {/* 左侧：图标和内容 */}
                                    <div className="flex items-start gap-3 min-w-0 flex-1">
                                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                                            <FileText className="h-5 w-5" />
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-semibold text-card-foreground truncate">
                                                {note.path.replace(/\.md$/, "")}
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                                                <Tooltip content={t("createdAt")} side="top" delay={300}>
                                                    <span className="hidden sm:flex items-center gap-1">
                                                        <Calendar className="h-3.5 w-3.5" />
                                                        {format(new Date(note.ctime), "yyyy-MM-dd HH:mm")}
                                                    </span>
                                                </Tooltip>
                                                <Tooltip content={t("updatedAt")} side="top" delay={300}>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3.5 w-3.5" />
                                                        {format(new Date(note.mtime), "yyyy-MM-dd HH:mm")}
                                                    </span>
                                                </Tooltip>
                                                {note.version > 0 && (
                                                    <Tooltip content={t("history")} side="top" delay={300}>
                                                        <span className="flex items-center gap-1">
                                                            <History className="h-3.5 w-3.5" />
                                                            v{note.version}
                                                        </span>
                                                    </Tooltip>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* 右侧：操作按钮 */}
                                    <div className="flex items-center gap-1 shrink-0">
                                        <Tooltip content={t("history") || "历史记录"} side="top" delay={200}>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 rounded-xl text-muted-foreground hover:text-purple-600"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onViewHistory(note);
                                                }}
                                            >
                                                <History className="h-4 w-4" />
                                            </Button>
                                        </Tooltip>
                                        {!isRecycle && (
                                            <Tooltip content={t("delete")} side="top" delay={200}>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-xl text-muted-foreground hover:text-destructive"
                                                    onClick={(e) => onDelete(e, note)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </Tooltip>
                                        )}
                                        {isRecycle && (
                                            <Tooltip content={t("restore")} side="top" delay={200}>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-xl text-muted-foreground hover:text-green-600"
                                                    onClick={(e) => onRestore(e, note)}
                                                >
                                                    <RotateCcw className="h-4 w-4" />
                                                </Button>
                                            </Tooltip>
                                        )}
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            )}

            {/* 分页控制 */}
            {notes.length > 0 && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4 pt-2 shrink-0">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{t("of")} {totalRows} {t("results")}</span>
                        <Select value={pageSize.toString()} onValueChange={(val) => {
                            const newSize = parseInt(val);
                            setPageSize(newSize);
                            setPage(1);
                        }}>
                            <SelectTrigger className="h-8 w-[100px] rounded-xl">
                                <SelectValue placeholder={pageSize.toString()} />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                {[10, 20, 50, 100].map((size) => (
                                    <SelectItem key={size} value={size.toString()} className="rounded-xl">
                                        {size} {t("perPage")}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(page - 1)}
                            disabled={page === 1 || loading}
                            className="rounded-xl"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            {t("previous")}
                        </Button>
                        <span className="text-sm font-medium px-2">
                            {page} / {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(page + 1)}
                            disabled={page === totalPages || loading}
                            className="rounded-xl"
                        >
                            {t("next")}
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

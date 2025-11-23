import { FileText, Trash2, RefreshCw, Plus, Eye, Pencil, Calendar, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNoteHandle } from "@/components/api-handle/note-handle";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { VaultType } from "@/lib/types/vault";
import { useState, useEffect } from "react";
import { Note } from "@/lib/types/note";
import { format } from "date-fns";


interface NoteListProps {
    vault: string;
    vaults?: VaultType[];
    onVaultChange?: (vault: string) => void;
    onSelectNote: (note: Note, mode: "view" | "edit") => void;
    onCreateNote: () => void;
}

export function NoteList({ vault, vaults, onVaultChange, onSelectNote, onCreateNote }: NoteListProps) {
    const { t } = useTranslation();
    const { handleNoteList, handleDeleteNote } = useNoteHandle();
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalRows, setTotalRows] = useState(0);

    const fetchNotes = (currentPage: number = page, currentPageSize: number = pageSize) => {
        setLoading(true);
        handleNoteList(vault, currentPage, currentPageSize, (data) => {
            setNotes(data.list);
            setTotalRows(data.pager.totalRows);
            setPage(data.pager.page);
            setLoading(false);
        });
    };

    useEffect(() => {
        setPage(1);
        fetchNotes(1);
    }, [vault]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= Math.ceil(totalRows / pageSize)) {
            setPage(newPage);
            fetchNotes(newPage);
        }
    };

    const onDelete = (e: React.MouseEvent, note: Note) => {
        e.stopPropagation();
        handleDeleteNote(vault, note.path, note.pathHash, () => {
            fetchNotes();
        });
    };

    const totalPages = Math.ceil(totalRows / pageSize);

    return (
        <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center space-x-4">
                    {vaults && onVaultChange ? (
                        <Select value={vault} onValueChange={onVaultChange}>
                            <SelectTrigger className="w-auto min-w-[240px] font-medium">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold"><SelectValue placeholder="Select Vault" /></span>
                                    <span className="text-muted-foreground">/</span>
                                    <span className="font-bold">{t("notes")}</span>
                                    <span className="text-muted-foreground text-sm">({totalRows})</span>
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
                            {t("notes")} ({totalRows})
                        </CardTitle>
                    )}
                </div>
                <div className="flex space-x-2">
                    <Button variant="outline" size="icon" onClick={() => fetchNotes()} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    </Button>
                    <Button onClick={onCreateNote}>
                        <Plus className="mr-2 h-4 w-4" />
                        {t("newNote")}
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="pb-6 pt-2">
                    {!notes || notes.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">{t("noNotes")}</div>
                    ) : (
                        <>
                            <div className="border-t border-b border-gray-200 divide-y divide-gray-200">
                                {notes.map((note, index) => (
                                    <div
                                        key={note.id}
                                        className={`flex items-center justify-between px-6 py-3 cursor-pointer transition-colors ${index % 2 === 0 ? "bg-white" : "bg-gray-50"
                                            } hover:bg-blue-50`}
                                        onClick={() => onSelectNote(note, "view")}
                                    >
                                        <div className="flex items-center space-x-4 overflow-hidden">
                                            <FileText className="h-5 w-5 text-blue-500 flex-shrink-0" />
                                            <div className="flex flex-col overflow-hidden">
                                                <span className="font-medium truncate text-base">{note.path.replace(/\.md$/, "")}</span>
                                                <div className="flex items-center space-x-3 text-xs text-gray-400">
                                                    <span className="flex items-center" title={t("createdAt")}>
                                                        <Calendar className="mr-1 h-3 w-3" />
                                                        {format(new Date(note.ctime), "yyyy-MM-dd HH:mm")}
                                                    </span>
                                                    <span className="flex items-center" title={t("updatedAt")}>
                                                        <Clock className="mr-1 h-3 w-3" />
                                                        {format(new Date(note.mtime), "yyyy-MM-dd HH:mm")}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onSelectNote(note, "view");
                                                }}
                                                title={t("view")}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-gray-500 hover:text-green-600 hover:bg-green-50"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onSelectNote(note, "edit");
                                                }}
                                                title={t("edit")}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50"
                                                onClick={(e) => onDelete(e, note)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {/* Pagination Controls */}
                            <div className="flex items-center justify-between px-6 py-4">
                                <div className="flex items-center space-x-2 text-sm text-gray-500">
                                    <span>{t("of")} {totalRows} {t("results")}</span>
                                    <Select value={pageSize.toString()} onValueChange={(val) => {
                                        const newSize = parseInt(val);
                                        setPageSize(newSize);
                                        setPage(1);
                                        fetchNotes(1, newSize);
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

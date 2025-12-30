import { ArrowLeft, Save, Pencil, Folder, History, RefreshCcw, Maximize2, Minimize2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useNoteHandle } from "@/components/api-handle/note-handle";
import { useState, useEffect, useCallback } from "react";
import { Note, NoteDetail } from "@/lib/types/note";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import MDEditor from "@uiw/react-md-editor";


interface NoteEditorProps {
    vault: string;
    note?: Note; // If undefined, it's a new note
    mode: "view" | "edit";
    onBack: () => void;
    onSaveSuccess: () => void;
    onEdit?: () => void;
    onViewHistory?: () => void;
    isMaximized?: boolean;
    onToggleMaximize?: () => void;
}

export function NoteEditor({
    vault,
    note,
    mode,
    onBack,
    onSaveSuccess,
    onEdit,
    onViewHistory,
    isMaximized = false,
    onToggleMaximize
}: NoteEditorProps) {
    const { t } = useTranslation();
    const { handleGetNote, handleSaveNote } = useNoteHandle();

    const [path, setPath] = useState("");
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [originalNote, setOriginalNote] = useState<NoteDetail | null>(null);

    const loadNote = useCallback(() => {
        if (note) {
            setPath(note.path.replace(/\.md$/, ""));
            setLoading(true);
            handleGetNote(vault, note.path, (data) => {
                setOriginalNote(data);
                setContent(data.content);
                setLoading(false);
            });
        } else {
            setPath("");
            setContent("");
            setOriginalNote(null);
        }
    }, [note, vault, handleGetNote]);

    useEffect(() => {
        loadNote();
    }, [loadNote]);

    const handleSave = () => {
        if (!path) return;
        setSaving(true);

        const fullPath = path.endsWith(".md") ? path : path + ".md";
        const options: { pathHash?: string; srcPath?: string; srcPathHash?: string; contentHash?: string } = {};
        if (originalNote) {
            // Editing existing note
            if (fullPath !== originalNote.path) {
                // Renaming
                options.srcPath = originalNote.path;
                options.srcPathHash = originalNote.pathHash;
                options.pathHash = originalNote.pathHash;
            } else {
                options.pathHash = originalNote.pathHash;
                options.contentHash = originalNote.contentHash;
            }
        }

        handleSaveNote(vault, fullPath, content, options, () => {
            setSaving(false);
            onSaveSuccess();
        });
    };

    // Helper to split path for display
    const getDisplayParts = (fullPath: string) => {
        const lastSlash = fullPath.lastIndexOf('/');
        if (lastSlash === -1) return { folder: '', filename: fullPath };
        return {
            folder: fullPath.substring(0, lastSlash),
            filename: fullPath.substring(lastSlash + 1)
        };
    };

    const { folder, filename } = getDisplayParts(path);

    return (
        <Card className="w-full h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3 border-b gap-4">
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    {mode === "view" ? (
                        <div className="flex flex-wrap items-center text-lg break-words min-w-0">
                            {folder && (
                                <>
                                    <Folder className="h-4 w-4 mr-1 text-muted-foreground shrink-0" />
                                    <span className="text-muted-foreground break-all">{folder}</span>
                                    <span className="text-muted-foreground mx-1">/</span>
                                </>
                            )}
                            <span className="font-bold break-all">{filename}</span>
                        </div>
                    ) : (
                        <Input
                            value={path}
                            onChange={(e) => {
                                // Filter out characters that are invalid in file systems
                                // Windows: < > : " \ | ? *
                                // Allow / for folder paths
                                // Also filter control characters (0-31)
                                // Trim leading and trailing spaces
                                const sanitized = e.target.value
                                    .replace(/[<>:"\\|?*]/g, '')
                                    .split('')
                                    .filter(c => c.charCodeAt(0) >= 32)
                                    .join('')
                                    .trim();
                                setPath(sanitized);
                            }}
                            placeholder={t("noteTitlePlaceholder").replace(" (e.g., note.md)", "").replace(" (例如: note.md)", "")}
                            className="font-bold text-lg border-none shadow-none focus-visible:ring-0 px-0"
                        />
                    )}
                </div>
                <div className="flex gap-2 items-center">
                    {mode === "edit" ? (
                        <Button onClick={handleSave} disabled={saving || loading || !path} className="shrink-0">
                            <Save className="mr-2 h-4 w-4" />
                            {saving ? t("saving") : t("save")}
                        </Button>
                    ) : (
                        <div className="flex gap-2">
                            {mode === "view" && note && (
                                <Button onClick={loadNote} variant="outline" size="icon" className="shrink-0" title={t("refresh")}>
                                    <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                                </Button>
                            )}
                            {note && onViewHistory && (
                                <Button onClick={onViewHistory} variant="outline" className="shrink-0">
                                    <History className="mr-2 h-4 w-4" />
                                    {t("history") || "历史"}
                                </Button>
                            )}
                            <Button onClick={onEdit} variant="outline" className="shrink-0">
                                <Pencil className="mr-2 h-4 w-4" />
                                {t("edit")}
                            </Button>
                        </div>
                    )}
                    {onToggleMaximize && (
                        <Button onClick={onToggleMaximize} variant="outline" size="icon" className="shrink-0" title={isMaximized ? t("restore") : t("maximize")}>
                            {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="flex-1 p-4 flex flex-col">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <div className="flex-1 min-h-[500px] overflow-hidden" data-color-mode="light">
                        <MDEditor
                            value={content}
                            onChange={(val) => setContent(val || "")}
                            height="100%"
                            preview={mode === "view" ? "preview" : "live"}
                            hideToolbar={mode === "view"}
                            visibleDragbar={mode === "edit"}
                        />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

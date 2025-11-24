import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useNoteHandle } from "@/components/api-handle/note-handle";
import { ArrowLeft, Save, Pencil } from "lucide-react";
import { Note, NoteDetail } from "@/lib/types/note";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import MDEditor from "@uiw/react-md-editor";
import { useState, useEffect } from "react";


interface NoteEditorProps {
    vault: string;
    note?: Note; // If undefined, it's a new note
    mode: "view" | "edit";
    onBack: () => void;
    onSaveSuccess: () => void;
    onEdit?: () => void;
}

export function NoteEditor({ vault, note, mode, onBack, onSaveSuccess, onEdit }: NoteEditorProps) {
    const { t } = useTranslation();
    const { handleGetNote, handleSaveNote } = useNoteHandle();

    const [path, setPath] = useState("");
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [originalNote, setOriginalNote] = useState<NoteDetail | null>(null);

    useEffect(() => {
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
    }, [note, vault]);

    const handleSave = () => {
        if (!path) return;
        setSaving(true);

        const fullPath = path.endsWith(".md") ? path : path + ".md";
        const options: any = {};
        if (originalNote) {
            // Editing existing note
            if (fullPath !== originalNote.path) {
                // Renaming
                options.srcPath = originalNote.path;
                options.srcPathHash = originalNote.pathHash;
                options.pathHash = originalNote.pathHash; // API doc says pathHash is needed when renaming? Let's try sending it.
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

    return (
        <Card className="w-full h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b gap-4">
                <div className="flex items-center space-x-2 flex-1">
                    <Button variant="ghost" size="icon" onClick={onBack}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    {mode === "view" ? (
                        <span className="font-bold text-lg px-0 break-words">{path}</span>
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
                                    .replace(/[<>:"\\|?*\x00-\x1f]/g, '')
                                    .trim();
                                setPath(sanitized);
                            }}
                            placeholder={t("noteTitlePlaceholder").replace(" (e.g., note.md)", "").replace(" (例如: note.md)", "")}
                            className="font-bold text-lg border-none shadow-none focus-visible:ring-0 px-0"
                        />
                    )}
                </div>
                {mode === "edit" ? (
                    <Button onClick={handleSave} disabled={saving || loading || !path}>
                        <Save className="mr-2 h-4 w-4" />
                        {saving ? t("saving") : t("save")}
                    </Button>
                ) : (
                    <Button onClick={onEdit} variant="outline">
                        <Pencil className="mr-2 h-4 w-4" />
                        {t("edit")}
                    </Button>
                )}
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

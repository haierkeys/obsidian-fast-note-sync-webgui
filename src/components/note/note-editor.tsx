import { ArrowLeft, Save, Pencil, Folder, History, RefreshCcw, Maximize2, Minimize2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useNoteHandle } from "@/components/api-handle/note-handle";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Note, NoteDetail } from "@/lib/types/note";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import MDEditor from "@uiw/react-md-editor";
import { hashCode } from "@/lib/utils/hash";
import env from "@/env.ts";


interface NoteEditorProps {
    vault: string;
    note?: Note; // If undefined, it's a new note
    mode: "view" | "edit";
    onBack: () => void;
    onSaveSuccess: (path: string, pathHash: string) => void;
    onEdit?: () => void;
    onViewHistory?: () => void;
    isMaximized?: boolean;
    onToggleMaximize?: () => void;
    isRecycle?: boolean;
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
    onToggleMaximize,
    isRecycle = false
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
            handleGetNote(vault, note.path, note.pathHash, isRecycle, (data) => {
                setOriginalNote(data);
                setContent(data.content);
                setLoading(false);
            });
        } else {
            setPath("");
            setContent("");
            setOriginalNote(null);
        }
    }, [note, vault, handleGetNote, isRecycle]);

    useEffect(() => {
        loadNote();
    }, [loadNote]);

    const processedContent = useMemo(() => {
        if (mode !== "view" || !content) return content;

        const token = localStorage.getItem("token") || "";
        const fileLinks = originalNote?.fileLinks || {};

        return content.replace(/(!)?\[\[([^\]]+)\]\]/g, (_, isEmbed, inner) => {
            const parts = inner.split('|');
            const rawPath = parts[0].split('#')[0]; // 移除锚点
            // 解析路径映射
            const resolvedPath = fileLinks[rawPath] || rawPath;
            const alias = parts[1] || rawPath;
            const options = parts.slice(1);

            if (isEmbed) {
                const apiUrl = `${env.API_URL}/api/note/file?vault=${encodeURIComponent(vault)}&path=${encodeURIComponent(resolvedPath)}&token=${encodeURIComponent(token)}`;
                const lowerPath = resolvedPath.toLowerCase();
                const isImage = /\.(png|jpg|jpeg|gif|svg|webp)$/.test(lowerPath);
                const isPdf = lowerPath.endsWith('.pdf');
                const isNote = lowerPath.endsWith('.md') || !lowerPath.includes('.');

                if (isImage) {
                    let style = "max-width: 100%; height: auto; display: block; margin: 10px 0;";
                    if (options[0]) {
                        const sizeMatch = options[0].match(/^(\d+)(x(\d+))?$/);
                        if (sizeMatch) {
                            const width = sizeMatch[1];
                            const height = sizeMatch[3];
                            style = `width: ${width}px; ${height ? `height: ${height}px;` : "height: auto;"} display: block; margin: 10px 0;`;
                        }
                    }
                    return `<img src="${apiUrl}" alt="${rawPath}" style="${style}" />`;
                } else if (isPdf) {
                    return `<embed src="${apiUrl}" type="application/pdf" width="100%" height="600px" style="margin: 10px 0;" />`;
                } else if (isNote) {
                    // 对于笔记，使用 iframe 嵌入
                    return `<iframe src="${apiUrl}" width="100%" height="400px" style="border: 1px solid #ddd; border-radius: 4px; margin: 10px 0;"></iframe>`;
                } else {
                    // 其他附件，显示下载链接块
                    // 注意：必须保持为单行或不带缩进，否则会被 Markdown 解析为代码块
                    // 修正 style 中的 items-center 为 align-items: center
                    return `<div style="margin: 10px 0; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc; display: flex; align-items: center; gap: 10px;"><div style="background: #3b82f6; color: white; padding: 6px; border-radius: 6px; display: flex; align-items: center;"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg></div><div style="flex: 1; overflow: hidden;"><div style="font-weight: 500; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${rawPath}</div><a href="${apiUrl}" download="${rawPath}" style="color: #2563eb; font-size: 12px; text-decoration: none; font-weight: 500; display: inline-block; margin-top: 2px;">点击下载附件</a></div></div>`;
                }
            } else {
                // 标准链接 [[path|alias]] -> [alias](path)
                return `[${alias}](${resolvedPath})`;
            }
        });
    }, [content, mode, vault, originalNote]);

    const handleSave = () => {
        if (!path) return;
        setSaving(true);

        const fullPath = path.endsWith(".md") ? path : path + ".md";
        const options: { pathHash?: string; srcPath?: string; srcPathHash?: string; contentHash?: string } = {
            pathHash: hashCode(fullPath),
            contentHash: hashCode(content)
        };

        if (originalNote) {
            // Editing existing note
            // Always set srcPath and srcPathHash to original path when editing
            options.srcPath = originalNote.path;
            options.srcPathHash = hashCode(originalNote.path);
        }

        handleSaveNote(vault, fullPath, content, options, () => {
            setSaving(false);
            onSaveSuccess(fullPath, options.pathHash || "");
        }, () => {
            setSaving(false);
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
                            {!isRecycle && (
                                <Button onClick={onEdit} variant="outline" className="shrink-0">
                                    <Pencil className="mr-2 h-4 w-4" />
                                    {t("edit")}
                                </Button>
                            )}
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
                            value={mode === "view" ? processedContent : content}
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

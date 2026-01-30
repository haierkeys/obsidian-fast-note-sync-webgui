import { FileText, Trash2, RefreshCw, Search, X, Calendar, Clock, ArrowUpDown, Paperclip, Image, Music, Video, FileCode, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useConfirmDialog } from "@/components/context/confirm-dialog-context";
import { useFileHandle } from "@/components/api-handle/file-handle";
import { Checkbox } from "@/components/ui/checkbox";
import React, { useState, useEffect } from "react";
import { File as FileDTO } from "@/lib/types/file";
import { Tooltip } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { VaultType } from "@/lib/types/vault";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

import { FilePreview } from "./file-preview";


type SortBy = "mtime" | "ctime" | "path";
type SortOrder = "desc" | "asc";

interface FileListProps {
    vault: string;
    vaults?: VaultType[];
    onVaultChange?: (vault: string) => void;
    isRecycle?: boolean;
    page: number;
    setPage: (page: number) => void;
    pageSize: number;
    setPageSize: (pageSize: number) => void;
    searchKeyword: string;
    setSearchKeyword: (keyword: string) => void;
}

/**
 * 格式化文件大小
 */
function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

export function FileList({ vault, vaults, onVaultChange, isRecycle = false, page, setPage, pageSize, setPageSize, searchKeyword, setSearchKeyword }: FileListProps) {
    const { t } = useTranslation();
    const { handleFileList, handleDeleteFile, handleRestoreFile, getRawFileUrl } = useFileHandle();
    const { openConfirmDialog } = useConfirmDialog();
    const [files, setFiles] = useState<FileDTO[]>([]);
    const [loading, setLoading] = useState(false);
    const [totalRows, setTotalRows] = useState(0);
    const [debouncedKeyword, setDebouncedKeyword] = useState(searchKeyword);
    const [sortBy, setSortBy] = useState<SortBy>("mtime");
    const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
    const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());

    // 预览相关状态
    const [previewFile, setPreviewFile] = useState<FileDTO | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>("");

    // Debounce search keyword
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedKeyword(searchKeyword);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchKeyword]);

    const fetchFiles = (currentPage: number = page, currentPageSize: number = pageSize, keyword: string = debouncedKeyword) => {
        setLoading(true);
        handleFileList(vault, currentPage, currentPageSize, isRecycle, keyword, sortBy, sortOrder, (data) => {
            setFiles(data.list || []);
            setTotalRows(data.pager?.totalRows || 0);
            setLoading(false);
        });
    };

    useEffect(() => {
        fetchFiles(page, pageSize, debouncedKeyword);
        setSelectedPaths(new Set());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [vault, page, pageSize, debouncedKeyword, isRecycle, sortBy, sortOrder]);

    // Reset page to 1 when search keyword changes
    useEffect(() => {
        setPage(1);
    }, [debouncedKeyword, setPage]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= Math.ceil(totalRows / pageSize)) {
            setPage(newPage);
        }
    };

    const onDelete = (e: React.MouseEvent, file: FileDTO) => {
        e.stopPropagation();
        openConfirmDialog(t("deleteFileConfirm", { title: file.path }), "confirm", () => {
            handleDeleteFile(vault, file.path, file.pathHash, () => {
                fetchFiles();
            });
        });
    };

    const onRestore = (e: React.MouseEvent, file: FileDTO) => {
        e.stopPropagation();
        openConfirmDialog(t("restoreFileConfirm", { title: file.path }), "confirm", () => {
            handleRestoreFile(vault, file.path, file.pathHash, () => {
                fetchFiles();
            });
        });
    };

    const toggleSelectAll = () => {
        if (selectedPaths.size === files.length && files.length > 0) {
            setSelectedPaths(new Set());
        } else {
            setSelectedPaths(new Set(files.map(f => f.pathHash)));
        }
    };

    const toggleSelect = (e: React.MouseEvent, pathHash: string) => {
        e.stopPropagation();
        const newSelected = new Set(selectedPaths);
        if (newSelected.has(pathHash)) {
            newSelected.delete(pathHash);
        } else {
            newSelected.add(pathHash);
        }
        setSelectedPaths(newSelected);
    };

    const onBatchRestore = () => {
        if (selectedPaths.size === 0) return;

        openConfirmDialog(t("batchRestoreConfirm", { count: selectedPaths.size }), "confirm", async () => {
            setLoading(true);
            const selectedFiles = files.filter(f => selectedPaths.has(f.pathHash));

            for (const file of selectedFiles) {
                await new Promise<void>((resolve) => {
                    handleRestoreFile(vault, file.path, file.pathHash, () => {
                        resolve();
                    });
                });
            }

            setSelectedPaths(new Set());
            fetchFiles();
        });
    };

    /**
     * 处理文件点击 (预览或下载)
     */
    const handleItemClick = (file: FileDTO) => {
        const url = getRawFileUrl(vault, file.path, file.pathHash?.toString());
        setPreviewFile(file);
        setPreviewUrl(url);
    };

    /**
     * 根据文件后缀获取对应的图标
     */
    const getFileIcon = (path: string) => {
        const ext = path.split('.').pop()?.toLowerCase() || '';

        // 图片类型
        if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp'].includes(ext)) {
            return <Image className="h-5 w-5" />;
        }
        // PDF 类型
        if (ext === 'pdf') {
            return <FileText className="h-5 w-5" />;
        }
        // 音频类型
        if (['mp3', 'wav', 'flac', 'ogg', 'm4a'].includes(ext)) {
            return <Music className="h-5 w-5" />;
        }
        // 视频类型
        if (['mp4', 'webm', 'mkv', 'avi', 'mov'].includes(ext)) {
            return <Video className="h-5 w-5" />;
        }
        // 脚本/代码类型
        if (['js', 'ts', 'jsx', 'tsx', 'py', 'sh', 'bat', 'go', 'css', 'html', 'json', 'c', 'cpp', 'rs', 'php'].includes(ext)) {
            return <FileCode className="h-5 w-5" />;
        }

        // 默认类型
        return <Paperclip className="h-5 w-5" />;
    };

    const totalPages = Math.ceil(totalRows / pageSize);

    return (
        <div className="w-full flex flex-col space-y-4">
            {/* 工具栏 */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-1">
                {/* 左侧：仓库选择 */}
                <div className="flex items-center gap-3">
                    {vaults && onVaultChange && (
                        <Select value={vault} onValueChange={onVaultChange}>
                            <SelectTrigger className="w-auto min-w-45 rounded-xl">
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
                        {totalRows} {t("file") || "附件"}
                    </span>
                    {isRecycle && files.length > 0 && (
                        <div className="flex items-center gap-2 ml-2 pl-4 border-l border-border">
                            <Checkbox
                                id="select-all"
                                checked={selectedPaths.size === files.length && files.length > 0}
                                onCheckedChange={toggleSelectAll}
                                className="rounded-md"
                            />
                            <label htmlFor="select-all" className="text-xs font-medium cursor-pointer">
                                {t("selectAll") || "全选"}
                            </label>
                            {selectedPaths.size > 0 && (
                                <>
                                    <span className="text-xs text-primary font-medium ml-2">
                                        {t("selectedCount", { count: selectedPaths.size })}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={onBatchRestore}
                                        className="h-8 rounded-xl ml-2 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700 hover:border-green-300"
                                    >
                                        <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                                        {t("batchRestore")}
                                    </Button>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* 右侧：搜索和操作 */}
                <div className="flex flex-col gap-2 w-full sm:w-auto">
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1 sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            <Input
                                type="text"
                                placeholder={t("searchFilePlaceholder") || "搜索附件..."}
                                className="pl-9 pr-8 rounded-xl"
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
                            onClick={() => fetchFiles()}
                            disabled={loading}
                            className="rounded-xl shrink-0"
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                        </Button>
                    </div>
                    {/* 排序选择 */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center h-8 rounded-xl border border-border overflow-hidden">
                            <button
                                className={`px-3 h-full text-xs flex items-center gap-1.5 transition-colors ${sortBy === "mtime" ? "bg-accent text-accent-foreground" : "hover:bg-muted"}`}
                                onClick={() => setSortBy("mtime")}
                            >
                                <Clock className="h-3.5 w-3.5" />
                                {t("sortByMtime") || "修改时间"}
                            </button>
                            <button
                                className={`px-3 h-full text-xs flex items-center gap-1.5 transition-colors border-l border-border ${sortBy === "ctime" ? "bg-accent text-accent-foreground" : "hover:bg-muted"}`}
                                onClick={() => setSortBy("ctime")}
                            >
                                <Calendar className="h-3.5 w-3.5" />
                                {t("sortByCtime") || "创建时间"}
                            </button>
                            <button
                                className={`px-3 h-full text-xs flex items-center gap-1.5 transition-colors border-l border-border ${sortBy === "path" ? "bg-accent text-accent-foreground" : "hover:bg-muted"}`}
                                onClick={() => setSortBy("path")}
                            >
                                <FileText className="h-3.5 w-3.5" />
                                {t("sortByPath") || "路径"}
                            </button>
                            <Tooltip content={sortOrder === "desc" ? t("sortDesc") : t("sortAsc")} side="top" delay={200}>
                                <button
                                    className="px-2.5 h-full text-xs flex items-center transition-colors border-l border-border hover:bg-muted"
                                    onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
                                >
                                    <ArrowUpDown className={`h-3.5 w-3.5 transition-transform ${sortOrder === "asc" ? "rotate-180" : ""}`} />
                                </button>
                            </Tooltip>
                        </div>
                    </div>
                </div>
            </div>

            {/* 附件列表 */}
            {loading ? (
                <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                    {t("loading") || "加载中..."}
                </div>
            ) : !Array.isArray(files) || files.length === 0 ? (
                <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
                    {t("noFiles") || "暂无附件"}
                </div>
            ) : (
                <div className="-mx-2 px-2">
                    <div className="grid grid-cols-1 gap-3 py-1">
                        {files.map((file, index) => (
                            <article
                                key={`${file.pathHash}-${index}`}
                                className="rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:shadow-md hover:border-primary/30 cursor-pointer"
                                onClick={() => handleItemClick(file)}
                            >
                                <div className="flex items-center justify-between gap-4">
                                    {/* 左侧：图标和内容 */}
                                    <div className="flex items-start gap-3 min-w-0 flex-1">
                                        {isRecycle && (
                                            <div
                                                className="flex items-center self-center"
                                                onClick={(e) => toggleSelect(e, file.pathHash)}
                                            >
                                                <Checkbox
                                                    checked={selectedPaths.has(file.pathHash)}
                                                    className="rounded-md"
                                                />
                                            </div>
                                        )}
                                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                                            {getFileIcon(file.path)}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-semibold text-card-foreground truncate">
                                                {file.path}
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">

                                                    {formatFileSize(file.size)}
                                                </span>
                                                <Tooltip content={t("createdAt")} side="top" delay={300}>
                                                    <span className="hidden sm:flex items-center gap-1">
                                                        <Calendar className="h-3.5 w-3.5" />
                                                        {format(new Date(file.ctime), "yyyy-MM-dd HH:mm")}
                                                    </span>
                                                </Tooltip>
                                                <Tooltip content={t("updatedAt")} side="top" delay={300}>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3.5 w-3.5" />
                                                        {format(new Date(file.mtime), "yyyy-MM-dd HH:mm")}
                                                    </span>
                                                </Tooltip>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 右侧：操作按钮 */}
                                    <div className="flex items-center gap-1 shrink-0">
                                        {!isRecycle && (
                                            <Tooltip content={t("delete")} side="top" delay={200}>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-xl text-muted-foreground hover:text-destructive"
                                                    onClick={(e) => onDelete(e, file)}
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
                                                    onClick={(e) => onRestore(e, file)}
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
            {files.length > 0 && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4 pt-2 shrink-0">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{t("of")} {totalRows} {t("results")}</span>
                        <Select value={pageSize.toString()} onValueChange={(val) => {
                            const newSize = parseInt(val);
                            setPageSize(newSize);
                            setPage(1);
                        }}>
                            <SelectTrigger className="h-8 w-25 rounded-xl">
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

            {/* 预览组件 */}
            {previewFile && (
                <FilePreview
                    key={previewUrl}
                    file={previewFile}
                    url={previewUrl}
                    onClose={() => {
                        setPreviewFile(null);
                        setPreviewUrl("");
                    }}
                />
            )}
        </div>
    );
}

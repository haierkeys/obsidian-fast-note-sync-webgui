import { useVaultHandle } from "@/components/api-handle/vault-handle";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { VaultType } from "@/lib/types/vault";
import { Database } from "lucide-react";

import { FileList } from "./file-list";


interface FileManagerProps {
    vault: string;
    onVaultChange?: (vault: string) => void;
    onNavigateToVaults?: () => void;
    isRecycle?: boolean;
}

/**
 * 附件管理器组件
 * 管理附件列表状态和仓库切换
 */
export function FileManager({
    vault,
    onVaultChange,
    onNavigateToVaults,
    isRecycle = false
}: FileManagerProps) {
    const { t } = useTranslation();
    const [vaults, setVaults] = useState<VaultType[]>([]);
    const vaultsLoaded = useRef(false);

    // Lifted state for pagination
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(() => {
        const saved = localStorage.getItem("filePageSize");
        return saved ? parseInt(saved, 10) : 10;
    });
    const [searchKeyword, setSearchKeyword] = useState("");

    useEffect(() => {
        localStorage.setItem("filePageSize", pageSize.toString());
    }, [pageSize]);

    const { handleVaultList } = useVaultHandle();

    useEffect(() => {
        handleVaultList((data) => {
            setVaults(data);
            vaultsLoaded.current = true;
        });
    }, [handleVaultList]);

    // Reset page when vault changes
    useEffect(() => {
        setPage(1);
    }, [vault]);

    // 检查是否有仓库（只在加载完成后显示空状态）
    if (vaultsLoaded.current && vaults.length === 0) {
        return (
            <div className="rounded-xl border border-border bg-card p-12 flex flex-col items-center justify-center">
                <Database className="h-16 w-16 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                    {t("noVaultsForFiles") || "暂无仓库"}
                </h3>
                <p className="text-muted-foreground mb-6 text-center">
                    {t("createVaultFirst") || "请先创建仓库"}
                </p>
                <Button
                    onClick={() => {
                        if (onNavigateToVaults) {
                            onNavigateToVaults();
                        }
                    }}
                    className="rounded-xl"
                >
                    {t("goToVaultManagement") || "前往仓库管理"}
                </Button>
            </div>
        );
    }

    return (
        <FileList
            vault={vault}
            vaults={vaults}
            onVaultChange={onVaultChange}
            isRecycle={isRecycle}
            page={page}
            setPage={setPage}
            pageSize={pageSize}
            setPageSize={setPageSize}
            searchKeyword={searchKeyword}
            setSearchKeyword={setSearchKeyword}
        />
    );
}

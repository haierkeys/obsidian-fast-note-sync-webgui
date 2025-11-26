import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { handleVault } from "@/components/api-handle/vault-handle";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { VaultType } from "@/lib/types/vault";
import { useState, useEffect } from "react";
import { Note } from "@/lib/types/note";
import { Database } from "lucide-react";

import { NoteEditor } from "./note-editor";
import { NoteList } from "./note-list";


interface NoteManagerProps {
    vault?: string;
    onVaultChange?: (vault: string) => void;
    onNavigateToVaults?: () => void;
}

export function NoteManager({ vault = "defaultVault", onVaultChange, onNavigateToVaults }: NoteManagerProps) {
    const { t } = useTranslation();
    const [view, setView] = useState<"list" | "editor">("list");
    const [mode, setMode] = useState<"view" | "edit">("view");
    const [selectedNote, setSelectedNote] = useState<Note | undefined>(undefined);
    const [vaults, setVaults] = useState<VaultType[]>([]);

    // Lifted state for pagination
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const { handleVaultList } = handleVault();

    useEffect(() => {
        handleVaultList((data) => {
            setVaults(data);
        });
    }, []);

    // Reset page when vault changes
    useEffect(() => {
        setPage(1);
    }, [vault]);

    const handleSelectNote = (note: Note, mode: "view" | "edit") => {
        setSelectedNote(note);
        setMode(mode);
        setView("editor");
    };

    const handleCreateNote = () => {
        setSelectedNote(undefined);
        setMode("edit");
        setView("editor");
    };

    const handleBack = () => {
        setView("list");
        setSelectedNote(undefined);
    };

    const handleSaveSuccess = () => {
        setView("list");
        setSelectedNote(undefined);
    };

    const handleEdit = () => {
        setMode("edit");
    };

    // 检查是否有仓库
    if (vaults.length === 0) {
        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle className="text-xl font-bold">{t("menuNotes")}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <Database className="h-16 w-16 text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                        {t("noVaultsForNotes")}
                    </h3>
                    <p className="text-gray-500 mb-6 text-center">
                        {t("createVaultFirst")}
                    </p>
                    <Button
                        onClick={() => {
                            if (onNavigateToVaults) {
                                onNavigateToVaults();
                            }
                        }}
                    >
                        {t("goToVaultManagement")}
                    </Button>
                </CardContent>
            </Card>
        );
    }

    if (view === "editor") {
        return (
            <NoteEditor
                vault={vault}
                note={selectedNote}
                mode={mode}
                onBack={handleBack}
                onSaveSuccess={handleSaveSuccess}
                onEdit={handleEdit}
            />
        );
    }

    return (
        <NoteList
            vault={vault}
            vaults={vaults}
            onVaultChange={onVaultChange}
            onSelectNote={handleSelectNote}
            onCreateNote={handleCreateNote}
            page={page}
            setPage={setPage}
            pageSize={pageSize}
            setPageSize={setPageSize}
        />
    );
}

"use client";

import * as React from "react";
import { Download, FileText, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type DocumentItem = {
    id: string;
    fileName: string;
    mimeType: string | null;
    size: number | null;
    createdAt: string;
    uploader?: { firstName: string | null; lastName: string | null; email: string | null } | null;
};

type Props = {
    clientId: string;
    currentUserId: string;
};

export function ClientDocumentsCard({ clientId, currentUserId }: Props) {
    const [documents, setDocuments] = React.useState<DocumentItem[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [uploading, setUploading] = React.useState(false);
    const [inputKey, setInputKey] = React.useState(0);
    const inputRef = React.useRef<HTMLInputElement>(null);

    const apiBase = process.env.NEXT_PUBLIC_API_URL;

    const loadDocuments = React.useCallback(async () => {
        if (!apiBase) return;
        setLoading(true);
        try {
            const res = await fetch(`${apiBase}/clients/${clientId}/documents`, {
                headers: currentUserId ? { "x-user-id": currentUserId } : undefined,
                cache: "no-store",
            });
            const data = (await res.json()) as { documents?: DocumentItem[]; error?: string };
            if (!res.ok) throw new Error(data.error ?? "Impossible de charger les documents.");
            setDocuments(data.documents ?? []);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Erreur lors du chargement des documents.";
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }, [apiBase, clientId, currentUserId]);

    React.useEffect(() => {
        void loadDocuments();
    }, [loadDocuments]);

    async function uploadFile(file: File) {
        if (!apiBase) {
            toast.error("Configuration API manquante.");
            return;
        }
        setUploading(true);
        try {
            const presignRes = await fetch(`${apiBase}/clients/${clientId}/documents/presign`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(currentUserId ? { "x-user-id": currentUserId } : {}),
                },
                body: JSON.stringify({
                    fileName: file.name,
                    contentType: file.type,
                    size: file.size,
                }),
            });
            const presignData = (await presignRes.json()) as {
                uploadUrl?: string;
                key?: string;
                fileName?: string;
                contentType?: string;
                error?: string;
            };
            if (!presignRes.ok || !presignData.uploadUrl || !presignData.key) {
                throw new Error(presignData.error ?? "Impossible de préparer l'upload.");
            }

            const uploadRes = await fetch(presignData.uploadUrl, {
                method: "PUT",
                headers: {
                    "Content-Type": presignData.contentType ?? (file.type || "application/octet-stream"),
                },
                body: file,
            });
            if (!uploadRes.ok) {
                throw new Error("L'upload vers S3 a échoué.");
            }

            const createRes = await fetch(`${apiBase}/clients/${clientId}/documents`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(currentUserId ? { "x-user-id": currentUserId } : {}),
                },
                body: JSON.stringify({
                    key: presignData.key,
                    fileName: presignData.fileName ?? file.name,
                    contentType: presignData.contentType ?? file.type,
                    size: file.size,
                }),
            });
            const createData = (await createRes.json()) as { error?: string };
            if (!createRes.ok) {
                throw new Error(createData.error ?? "Impossible d'enregistrer le document.");
            }

            toast.success("Document ajouté.");
            setInputKey((prev) => prev + 1);
            await loadDocuments();
        } catch (error) {
            const message = error instanceof Error ? error.message : "Erreur lors de l'upload.";
            toast.error(message);
        } finally {
            setUploading(false);
        }
    }

    async function handleDownload(documentId: string) {
        if (!apiBase) {
            toast.error("Configuration API manquante.");
            return;
        }
        try {
            const res = await fetch(`${apiBase}/clients/${clientId}/documents/${documentId}/download`, {
                headers: currentUserId ? { "x-user-id": currentUserId } : undefined,
            });
            const data = (await res.json()) as { url?: string; error?: string };
            if (!res.ok || !data.url) {
                throw new Error(data.error ?? "Impossible de récupérer le lien.");
            }
            window.open(data.url, "_blank", "noopener,noreferrer");
        } catch (error) {
            const message = error instanceof Error ? error.message : "Erreur lors du téléchargement.";
            toast.error(message);
        }
    }

    return (
        <Card className="border-muted/60">
            <CardHeader>
                <CardTitle className="text-base">Documents</CardTitle>
                <CardDescription>Ajoute et conserve les fichiers liés à ce client.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                    <Input
                        key={inputKey}
                        type="file"
                        ref={inputRef}
                        onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) {
                                void uploadFile(file);
                            }
                        }}
                        disabled={uploading}
                        className="hidden"
                    />
                    <Button
                        type="button"
                        variant="outline"
                        disabled={uploading}
                        className="gap-2"
                        onClick={() => inputRef.current?.click()}
                    >
                        <Upload className="h-4 w-4" />
                        {uploading ? "Upload en cours..." : "Ajouter un document"}
                    </Button>
                </div>

                {loading ? (
                    <p className="text-sm text-muted-foreground">Chargement des documents...</p>
                ) : documents.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucun document ajouté.</p>
                ) : (
                    <div className="space-y-2">
                        {documents.map((doc) => (
                            <div
                                key={doc.id}
                                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-dashed border-muted px-3 py-2"
                            >
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 text-sm font-medium">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        <span className="truncate">{doc.fileName}</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {new Date(doc.createdAt).toLocaleString("fr-FR")}
                                        {doc.size ? ` · ${formatSize(doc.size)}` : ""}
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="gap-2"
                                    onClick={() => handleDownload(doc.id)}
                                >
                                    <Download className="h-4 w-4" />
                                    Télécharger
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} o`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} Ko`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} Mo`;
}

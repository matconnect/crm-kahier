"use client";

import * as React from "react";
import { Check, Download, Eye, FileText, Pencil, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { getBrowserApiBase } from "@/lib/public-api-base";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
    canEdit: boolean;
};

export function ClientDocumentsCard({ clientId, currentUserId, canEdit }: Props) {
    const [documents, setDocuments] = React.useState<DocumentItem[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [uploading, setUploading] = React.useState(false);
    const [inputKey, setInputKey] = React.useState(0);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [previewDoc, setPreviewDoc] = React.useState<DocumentItem | null>(null);
    const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
    const [previewLoading, setPreviewLoading] = React.useState(false);
    const [uploadName, setUploadName] = React.useState("");
    const [pendingFile, setPendingFile] = React.useState<File | null>(null);
    const [renamingId, setRenamingId] = React.useState<string | null>(null);
    const [renameValue, setRenameValue] = React.useState("");
    const [deletingId, setDeletingId] = React.useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = React.useState<DocumentItem | null>(null);

    const apiBase = getBrowserApiBase();

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
            const desiredName = uploadName.trim() || file.name;
            const presignRes = await fetch(`${apiBase}/clients/${clientId}/documents/presign`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(currentUserId ? { "x-user-id": currentUserId } : {}),
                },
                body: JSON.stringify({
                    fileName: desiredName,
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
                headers: presignData.contentType ? { "Content-Type": presignData.contentType } : undefined,
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
                    fileName: presignData.fileName ?? desiredName,
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
            setUploadName("");
            setPendingFile(null);
            await loadDocuments();
        } catch (error) {
            const message = error instanceof Error ? error.message : "Erreur lors de l'upload.";
            toast.error(message);
        } finally {
            setUploading(false);
        }
    }

    async function handleDownload(documentId: string, fileName?: string) {
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
            const fileRes = await fetch(data.url);
            if (!fileRes.ok) {
                throw new Error("Impossible de télécharger le fichier.");
            }
            const blob = await fileRes.blob();
            const objectUrl = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = objectUrl;
            if (fileName) {
                link.download = fileName;
            }
            link.rel = "noopener noreferrer";
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(objectUrl);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Erreur lors du téléchargement.";
            toast.error(message);
        }
    }

    async function handlePreview(doc: DocumentItem) {
        if (!apiBase) {
            toast.error("Configuration API manquante.");
            return;
        }
        try {
            setPreviewLoading(true);
            const res = await fetch(`${apiBase}/clients/${clientId}/documents/${doc.id}/download`, {
                headers: currentUserId ? { "x-user-id": currentUserId } : undefined,
            });
            const data = (await res.json()) as { url?: string; error?: string };
            if (!res.ok || !data.url) {
                throw new Error(data.error ?? "Impossible de récupérer le lien.");
            }
            setPreviewDoc(doc);
            setPreviewUrl(data.url);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Erreur lors de l'ouverture.";
            toast.error(message);
            setPreviewLoading(false);
        }
    }

    function isPreviewable(doc: DocumentItem) {
        if (!doc.mimeType) return false;
        return doc.mimeType.startsWith("image/") || doc.mimeType === "application/pdf";
    }

    async function handleRenameSave(doc: DocumentItem) {
        if (!apiBase) {
            toast.error("Configuration API manquante.");
            return;
        }
        const nextName = renameValue.trim();
        if (!nextName) {
            toast.error("Nom de document requis.");
            return;
        }
        try {
            const res = await fetch(`${apiBase}/clients/${clientId}/documents/${doc.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    ...(currentUserId ? { "x-user-id": currentUserId } : {}),
                },
                body: JSON.stringify({ fileName: nextName }),
            });
            const data = (await res.json()) as { document?: DocumentItem; error?: string };
            if (!res.ok) {
                throw new Error(data.error ?? "Impossible de renommer le document.");
            }
            toast.success("Nom du document mis à jour.");
            setRenamingId(null);
            setRenameValue("");
            await loadDocuments();
        } catch (error) {
            const message = error instanceof Error ? error.message : "Erreur lors du renommage.";
            toast.error(message);
        }
    }

    async function handleDelete(doc: DocumentItem) {
        if (!apiBase) {
            toast.error("Configuration API manquante.");
            return;
        }
        try {
            setDeletingId(doc.id);
            const res = await fetch(`${apiBase}/clients/${clientId}/documents/${doc.id}`, {
                method: "DELETE",
                headers: currentUserId ? { "x-user-id": currentUserId } : undefined,
            });
            const data = (await res.json().catch(() => null)) as { error?: string } | null;
            if (!res.ok) {
                throw new Error(data?.error ?? "Impossible de supprimer le document.");
            }
            toast.success("Document supprimé.");
            await loadDocuments();
        } catch (error) {
            const message = error instanceof Error ? error.message : "Erreur lors de la suppression.";
            toast.error(message);
        } finally {
            setDeletingId(null);
        }
    }

    return (
        <Card className="border-muted/60">
            <CardHeader>
                <CardTitle className="text-base">Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {canEdit && (
                    <div className="flex flex-wrap items-center gap-3">
                        <Input
                            key={inputKey}
                            type="file"
                            ref={inputRef}
                            onChange={(event) => {
                                const file = event.target.files?.[0];
                                if (file) {
                                    setPendingFile(file);
                                    setUploadName(file.name);
                                }
                            }}
                            disabled={uploading}
                            className="hidden"
                        />
                        {pendingFile && (
                            <Input
                                value={uploadName}
                                onChange={(event) => setUploadName(event.target.value)}
                                placeholder="Nom du document"
                                className="max-w-sm"
                                disabled={uploading}
                            />
                        )}
                        <Button
                            type="button"
                            variant="outline"
                            disabled={uploading}
                            className="gap-2"
                            onClick={() => {
                                if (pendingFile) {
                                    void uploadFile(pendingFile);
                                    return;
                                }
                                inputRef.current?.click();
                            }}
                        >
                            <Upload className="h-4 w-4" />
                            {uploading
                                ? "Upload en cours..."
                                : pendingFile
                                  ? "Envoyer le document"
                                  : "Ajouter un document"}
                        </Button>
                    </div>
                )}

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
                                        {renamingId === doc.id ? (
                                            <Input
                                                value={renameValue}
                                                onChange={(event) => setRenameValue(event.target.value)}
                                                className="h-8 max-w-xs"
                                            />
                                        ) : (
                                            <span className="truncate">{doc.fileName}</span>
                                        )}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {new Date(doc.createdAt).toLocaleString("fr-FR")}
                                        {doc.size ? ` · ${formatSize(doc.size)}` : ""}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 sm:ml-auto">
                                    {canEdit && renamingId === doc.id ? (
                                        <>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                aria-label="Enregistrer"
                                                onClick={() => handleRenameSave(doc)}
                                            >
                                                <Check className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                aria-label="Annuler"
                                                onClick={() => {
                                                    setRenamingId(null);
                                                    setRenameValue("");
                                                }}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </>
                                    ) : canEdit ? (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            aria-label="Renommer"
                                            onClick={() => {
                                                setRenamingId(doc.id);
                                                setRenameValue(doc.fileName);
                                            }}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                    ) : null}
                                    {canEdit && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            aria-label="Supprimer"
                                            disabled={deletingId === doc.id}
                                            onClick={() => setDeleteTarget(doc)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        aria-label="Télécharger"
                                        onClick={() => handleDownload(doc.id, doc.fileName)}
                                    >
                                        <Download className="h-4 w-4" />
                                    </Button>
                                    {isPreviewable(doc) && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            aria-label="Voir"
                                            onClick={() => handlePreview(doc)}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
            <Dialog
                open={Boolean(previewUrl && previewDoc)}
                onOpenChange={(open) => {
                    if (!open) {
                        setPreviewDoc(null);
                        setPreviewUrl(null);
                        setPreviewLoading(false);
                    }
                }}
            >
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>{previewDoc?.fileName ?? "Document"}</DialogTitle>
                    </DialogHeader>
                    <div className="relative rounded-md border border-dashed border-muted p-2">
                        {previewLoading && (
                            <div className="absolute inset-0 flex items-center justify-center rounded-md bg-background/80 text-sm text-muted-foreground">
                                Chargement du document...
                            </div>
                        )}
                        {previewUrl && previewDoc?.mimeType?.startsWith("image/") && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={previewUrl}
                                alt={previewDoc.fileName}
                                className="max-h-[70vh] w-full object-contain"
                                onLoad={() => setPreviewLoading(false)}
                                onError={() => setPreviewLoading(false)}
                            />
                        )}
                        {previewUrl && previewDoc?.mimeType === "application/pdf" && (
                            <iframe
                                src={previewUrl}
                                title={previewDoc.fileName}
                                className="h-[70vh] w-full"
                                onLoad={() => setPreviewLoading(false)}
                            />
                        )}
                        {previewUrl && !previewDoc?.mimeType?.startsWith("image/") && previewDoc?.mimeType !== "application/pdf" && (
                            <p className="text-sm text-muted-foreground">
                                Ce format ne peut pas être prévisualisé.
                            </p>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
            <Dialog
                open={Boolean(deleteTarget)}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeleteTarget(null);
                    }
                }}
            >
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Supprimer le document ?</DialogTitle>
                    </DialogHeader>
                    <div className="text-sm text-muted-foreground">
                        Cette action est définitive.{" "}
                        <span className="font-medium text-foreground">{deleteTarget?.fileName}</span> sera supprimé.
                    </div>
                    <DialogFooter className="gap-2">
                        <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
                            Annuler
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            disabled={deleteTarget ? deletingId === deleteTarget.id : false}
                            onClick={async () => {
                                if (!deleteTarget) return;
                                await handleDelete(deleteTarget);
                                setDeleteTarget(null);
                            }}
                        >
                            Supprimer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
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

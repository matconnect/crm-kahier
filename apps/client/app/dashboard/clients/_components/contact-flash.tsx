"use client";

import * as React from "react";
import { Mail, PhoneCall } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

type Props = {
    primaryPhone: string | null;
    primaryEmail: string | null;
};

export function ContactFlash({ primaryPhone, primaryEmail }: Props) {
    const [callCapable, setCallCapable] = React.useState(false);

    React.useEffect(() => {
        const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
        const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(ua);
        const isMac = /Macintosh|Mac OS X/i.test(ua);
        setCallCapable(isMobile || isMac);
    }, []);

    const callDisabled = !primaryPhone;
    const callLabel = !primaryPhone ? "Aucun numéro" : callCapable ? "Appeler" : "Appel indisponible";

    return (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
            <div className="flex items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2 font-medium text-foreground">
                    <PhoneCall className="h-4 w-4 text-primary" />
                    Contact flash
                </div>
                <div className="text-xs text-muted-foreground">
                    {primaryEmail
                        ? "Email dispo"
                        : primaryPhone
                            ? `Téléphone dispo (${primaryPhone})`
                            : "Aucune coordonnée"}
                </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
                <Dialog>
                    <DialogTrigger asChild>
                        <Button
                            size="sm"
                            variant="outline"
                            className="justify-center"
                            disabled={callDisabled}
                            title={
                                callDisabled
                                    ? "Appel non disponible"
                                    : callCapable
                                        ? "Appeler le contact"
                                        : "Voir le numéro"
                            }
                        >
                            {callLabel}
                        </Button>
                    </DialogTrigger>
                    {!callDisabled && (
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Coordonnées du contact</DialogTitle>
                                <DialogDescription>
                                    {callCapable
                                        ? "Lancement d’un appel direct."
                                        : "Appel direct indisponible sur cet appareil. Utilise le numéro ci-dessous."}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="rounded-md border bg-muted/50 p-3 text-sm">
                                <div className="font-medium text-foreground">Téléphone</div>
                                <div className="text-muted-foreground">{primaryPhone}</div>
                            </div>
                            <DialogFooter className="gap-2">
                                {!callCapable && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            if (!primaryPhone) return;
                                            navigator.clipboard
                                                ?.writeText(primaryPhone)
                                                .then(() => toast.success("Numéro copié"))
                                                .catch(() => toast.error("Impossible de copier le numéro"));
                                        }}
                                    >
                                        Copier le numéro
                                    </Button>
                                )}
                                <Button
                                    type="button"
                                    size="sm"
                                    disabled={!callCapable}
                                    onClick={() => {
                                        if (!primaryPhone || !callCapable) return;
                                        window.location.href = `tel:${primaryPhone}`;
                                    }}
                                >
                                    Appeler
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    )}
                </Dialog>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button
                            size="sm"
                            variant="outline"
                            className="justify-center"
                            disabled={!primaryEmail}
                            title={primaryEmail ? "Voir l'email" : "Email manquant"}
                        >
                            <span className="inline-flex items-center gap-1">
                                <Mail className="h-4 w-4" />
                                Email
                            </span>
                        </Button>
                    </DialogTrigger>
                    {primaryEmail && (
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Email du contact</DialogTitle>
                                <DialogDescription>Ouvre ou copie l&apos;adresse pour écrire rapidement.</DialogDescription>
                            </DialogHeader>
                            <div className="rounded-md border bg-muted/50 p-3 text-sm">
                                <div className="font-medium text-foreground">Email</div>
                                <div className="text-muted-foreground break-all">{primaryEmail}</div>
                            </div>
                            <DialogFooter className="gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        navigator.clipboard
                                            ?.writeText(primaryEmail)
                                            .then(() => toast.success("Email copié"))
                                            .catch(() => toast.error("Impossible de copier l'email"));
                                    }}
                                >
                                    Copier l&apos;email
                                </Button>
                                <Button type="button" size="sm" asChild>
                                    <a href={`mailto:${primaryEmail}`}>Ouvrir dans le client mail</a>
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    )}
                </Dialog>
            </div>
        </div>
    );
}

import Link from "next/link";
import { LayoutGrid, Save } from "lucide-react";
import { requireAuth } from "@/lib/authz";
import { DashboardTopBar } from "@/components/dashboard/top-bar";
import { Button } from "@/components/ui/button";
import { CreateClientForm } from "./create-client-form";

export default async function NewClientPage() {
    const session = await requireAuth();
    const currentUserId = session.user?.id ?? "";
    const currentUserLabel = session.user?.email ?? "Moi";

    return (
        <div className="min-h-screen bg-background">
            <DashboardTopBar
                subtitle="Nouveau client"
                anchors={[
                    { label: "Fiche", href: "#client-form" },
                    { label: "Contact", href: "#client-form" },
                    { label: "Notes", href: "#client-form" },
                ]}
            />

            <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10" id="client-form">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground">
                            Vue clients
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Connecté : {session.user?.email}
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Nouveau client</h1>
                            <p className="text-sm text-muted-foreground">
                                Renseigne le compte, le responsable, les contacts et les notes en une fois.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Link
                            href="/dashboard/clients"
                            className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                            <LayoutGrid className="h-4 w-4" />
                            Retour liste
                        </Link>
                        <Button asChild className="gap-2">
                            <button type="submit" form="client-create-form">
                                <Save className="h-4 w-4" />
                                Créer le client
                            </button>
                        </Button>
                    </div>
                </div>

                <CreateClientForm
                    currentUserId={currentUserId}
                    currentUserLabel={currentUserLabel}
                    currentUserEmail={session.user?.email}
                />
            </div>
        </div>
    );
}

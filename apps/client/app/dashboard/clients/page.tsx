import Link from "next/link";
import { Plus } from "lucide-react";

import { requireAuth } from "@/lib/authz";
import { DashboardTopBar } from "@/components/dashboard/top-bar";

import { ClientsFilters } from "./_components/clients-filters";
import { ClientsList } from "./_components/clients-list";
import { ClientsSummary } from "./_components/clients-summary";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
    searchParams: Promise<{
        q?: string;
        status?: string;
        segment?: string;
        location?: string;
        page?: string;
        pageSize?: string;
    }>;
};

export default async function ClientsPage({ searchParams }: PageProps) {
    const session = await requireAuth();
    const sp = await searchParams;
    const currentUserId = session.user?.id ?? "";
    const currentUserRole = session.user?.role ?? "USER";

    return (
        <div className="min-h-screen bg-background">
            <DashboardTopBar
                subtitle="Clients"
                anchors={[
                    { label: "Vue d’ensemble", href: "#clients-summary" },
                    { label: "Filtres", href: "#clients-filters" },
                    { label: "Clients", href: "#clients-list" },
                ]}
            />
            <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground">
                            Vue clients
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Connecté : {session.user?.email}
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Clients & Prospects</h1>
                            <p className="text-sm text-muted-foreground">
                                Suivez vos comptes, contacts clés et dernières interactions.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Link
                            href="/dashboard/clients/new"
                            className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground shadow hover:bg-primary/90"
                        >
                            <Plus className="h-4 w-4" />
                            Nouveau client
                        </Link>
                    </div>
                </div>

                <ClientsSummary currentUserId={currentUserId} />
                <ClientsFilters searchParams={sp} />
                <ClientsList searchParams={sp} currentUserId={currentUserId} currentUserRole={currentUserRole} />
            </div>
        </div>
    );
}

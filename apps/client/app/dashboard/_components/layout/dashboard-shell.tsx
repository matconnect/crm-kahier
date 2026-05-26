import type { ReactNode } from "react";

import { DashboardTopHeader } from "./dashboard-top-header";
import { SidebarMenu } from "./sidebar-menu";
import type { ActiveMenuKey } from "./types";
import type { ClientSearchItem, InteractionItem, ProjectSearchItem, SummaryResponse } from "../shared/types";
import { auth } from "@/lib/session";
import { getServerApiBase } from "@/lib/api-base";

type DashboardShellProps = {
    firstName: string;
    email?: string | null;
    summary: SummaryResponse;
    interactionsCount: number;
    activeMenu: ActiveMenuKey;
    searchValue?: string;
    searchClients?: ClientSearchItem[];
    searchInteractions?: InteractionItem[];
    searchProjects?: ProjectSearchItem[];
    children: ReactNode;
};

export async function DashboardShell({
    firstName,
    email,
    summary,
    interactionsCount,
    activeMenu,
    searchValue,
    searchClients = [],
    searchInteractions = [],
    searchProjects = [],
    children,
}: DashboardShellProps) {
    // TODO(modules): brancher les vrais compteurs devis/factures quand les modules seront implémentés.
    const devisCount = 0;
    const facturesCount = 0;

    const session = await auth();
    let subscriptionType = session?.user?.subscriptionType ?? "STARTER_FREE";
    const userId = session?.user?.id ?? "";
    const apiBase = getServerApiBase();
    if (userId && apiBase) {
        try {
            const response = await fetch(`${apiBase}/profile/subscription`, {
                cache: "no-store",
                headers: { "x-user-id": userId },
            });
            if (response.ok) {
                const data = (await response.json()) as { company?: { subscriptionType?: string | null } };
                subscriptionType = data.company?.subscriptionType ?? subscriptionType;
            }
        } catch {
            // Fallback silencieux sur la session locale.
        }
    }

    return (
        <div className="min-h-screen w-full bg-[#eef0f6] text-[#14151b]">
            <div className="grid min-h-screen w-full lg:grid-cols-[320px_minmax(0,1fr)]">
                <SidebarMenu
                    email={email}
                    activeClients={summary.active}
                    prospects={summary.prospects}
                    interactionsCount={interactionsCount}
                    projectsCount={searchProjects.length}
                    devisCount={devisCount}
                    facturesCount={facturesCount}
                    activeMenu={activeMenu}
                    subscriptionType={subscriptionType}
                />

                <section className="flex min-w-0 flex-col">
                    <DashboardTopHeader
                        firstName={firstName}
                        searchValue={searchValue}
                        searchClients={searchClients}
                        searchInteractions={searchInteractions}
                        searchProjects={searchProjects}
                    />
                    <div className="min-h-0 flex-1 bg-[#edf0f7] p-4 md:p-8">{children}</div>
                </section>
            </div>
        </div>
    );
}

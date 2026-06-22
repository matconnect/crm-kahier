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
    const devisCount = 0;
    let facturesCount = 0;

    const session = await auth();
    let subscriptionType = session?.user?.subscriptionType ?? "STARTER_FREE";
    const userId = session?.user?.id ?? "";
    const apiBase = getServerApiBase();
    if (userId && apiBase) {
        try {
            const [subscriptionResponse, invoicesResponse] = await Promise.all([
                fetch(`${apiBase}/profile/subscription`, {
                    cache: "no-store",
                    headers: { "x-user-id": userId },
                }),
                fetch(`${apiBase}/invoices/summary`, {
                    cache: "no-store",
                    headers: { "x-user-id": userId },
                }),
            ]);
            if (subscriptionResponse.ok) {
                const data = (await subscriptionResponse.json()) as { company?: { subscriptionType?: string | null } };
                subscriptionType = data.company?.subscriptionType ?? subscriptionType;
            }
            if (invoicesResponse.ok) {
                const data = (await invoicesResponse.json()) as { total?: number };
                facturesCount = data.total ?? 0;
            }
        } catch {
            // Fallback silencieux sur la session locale.
        }
    }

    return (
        <div className="min-h-screen w-full bg-[#e8edf2] p-0 text-[#10121a] lg:p-5">
            <div className="mx-auto grid min-h-screen w-full max-w-[1720px] overflow-hidden bg-[#fbfcff] shadow-[0_24px_80px_rgba(31,38,58,0.10)] lg:min-h-[calc(100vh-2.5rem)] lg:grid-cols-[300px_minmax(0,1fr)] lg:rounded-[28px] lg:border lg:border-white">
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

                <section className="flex min-w-0 flex-col bg-[#f7f8fc]">
                    <DashboardTopHeader
                        firstName={firstName}
                        searchValue={searchValue}
                        searchClients={searchClients}
                        searchInteractions={searchInteractions}
                        searchProjects={searchProjects}
                    />
                    <div className="min-h-0 flex-1 border-t border-[#e6e9f0] bg-[#f7f8fc] p-4 md:p-7">{children}</div>
                </section>
            </div>
        </div>
    );
}

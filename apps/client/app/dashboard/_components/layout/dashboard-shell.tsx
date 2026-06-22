import type { ReactNode } from "react";

import { DashboardTopHeader } from "./dashboard-top-header";
import { MobileSidebar } from "./mobile-sidebar";
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
    let devisCount = 0;
    let facturesCount = 0;

    const session = await auth();
    let subscriptionType = session?.user?.subscriptionType ?? "STARTER_FREE";
    const userId = session?.user?.id ?? "";
    const apiBase = getServerApiBase();
    if (userId && apiBase) {
        try {
            const [subscriptionResponse, invoicesResponse, quotesResponse] = await Promise.all([
                fetch(`${apiBase}/profile/subscription`, {
                    cache: "no-store",
                    headers: { "x-user-id": userId },
                }),
                fetch(`${apiBase}/invoices/summary`, {
                    cache: "no-store",
                    headers: { "x-user-id": userId },
                }),
                fetch(`${apiBase}/quotes/summary`, {
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
            if (quotesResponse.ok) {
                const data = (await quotesResponse.json()) as { total?: number };
                devisCount = data.total ?? 0;
            }
        } catch {
            // Fallback silencieux sur la session locale.
        }
    }

    return (
        <div className="min-h-screen w-full bg-[#fbfcff] text-[#10121a]">
            <div className="grid min-h-screen w-full bg-[#fbfcff] lg:grid-cols-[300px_minmax(0,1fr)]">
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
                        mobileSidebar={
                            <MobileSidebar
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
                        }
                    />
                    <div className="min-h-0 flex-1 border-t border-[#e6e9f0] bg-[#f7f8fc] p-4 md:p-7">{children}</div>
                </section>
            </div>
        </div>
    );
}

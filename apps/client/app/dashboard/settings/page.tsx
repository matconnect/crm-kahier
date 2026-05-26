import Link from "next/link";
import { MotionReveal } from "@/components/motion/reveal";

import { requireAuth } from "@/lib/authz";
import { CompanySection } from "../_components/company-section";
import { KahierLinkSection } from "../_components/kahier-link-section";
import { DashboardShell, fetchDashboardData } from "../_components";
import { ProfileSection } from "../_components/profile-section";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SettingsPage() {
    const session = await requireAuth();
    const userId = session.user?.id ?? "";
    const email = session.user?.email ?? "";
    const initialLastName = session.user?.lastName?.trim() ?? "";
    const role = (session.user?.role ?? "USER") as "USER" | "MANAGER" | "ADMIN";
    const initialFirstName = session.user?.firstName?.trim() ?? "";
    const firstName = initialFirstName || "équipe";

    const { summary, interactions, clients, projects } = await fetchDashboardData(userId);

    return (
        <DashboardShell
            firstName={firstName}
            email={session.user?.email}
            summary={summary}
            interactionsCount={interactions.length}
            activeMenu="settings"
            searchClients={clients}
            searchInteractions={interactions}
            searchProjects={projects}
        >
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
                <MotionReveal>
                    <section className="rounded-[28px] border border-white/70 bg-[#f8f9fd] px-6 py-7 shadow-[0_20px_50px_rgba(29,33,49,0.08)] md:px-8">
                        <div className="relative flex flex-col gap-3">
                            <div>
                                <p className="text-xs uppercase tracking-[0.18em] text-[#8f93a9]">Configuration</p>
                                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Paramètres organisation</h1>
                                <p className="text-sm text-[#6f7488]">
                                    Gérez l&apos;entreprise, partagez le code d&apos;invitation et consultez les rôles des membres.
                                </p>
                            </div>
                        </div>
                    </section>
                </MotionReveal>

                <MotionReveal delay={80}>
                    <div id="profile" className="rounded-[28px] border border-white/70 bg-white p-5 scroll-mt-24 shadow-[0_20px_50px_rgba(29,33,49,0.08)] md:p-6">
                        <ProfileSection
                            userId={userId}
                            email={email}
                            initialFirstName={initialFirstName}
                            initialLastName={initialLastName}
                        />
                    </div>
                </MotionReveal>

                <MotionReveal delay={140}>
                    <div id="company" className="rounded-[28px] border border-white/70 bg-white p-5 scroll-mt-24 shadow-[0_20px_50px_rgba(29,33,49,0.08)] md:p-6">
                        <CompanySection userId={userId} />
                    </div>
                </MotionReveal>

                <MotionReveal delay={200}>
                    <div id="kahier-link" className="rounded-[28px] border border-white/70 bg-white p-5 scroll-mt-24 shadow-[0_20px_50px_rgba(29,33,49,0.08)] md:p-6">
                        <KahierLinkSection userId={userId} role={role} />
                    </div>
                </MotionReveal>
            </div>
        </DashboardShell>
    );
}

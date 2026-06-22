import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { MotionReveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { requireBillingFeature } from "@/lib/authz";
import { DashboardShell, fetchDashboardData } from "../../_components";
import { InvoiceForm } from "../_components/invoice-form";
import { fetchInvoiceClients } from "../_lib/server";

export default async function NewInvoicePage() {
    const session = await requireBillingFeature("invoices_module");
    const currentUserId = session.user.id;
    const [clients, dashboard] = await Promise.all([
        fetchInvoiceClients(currentUserId),
        fetchDashboardData(currentUserId),
    ]);

    return (
        <DashboardShell
            firstName={session.user.firstName?.trim() || "équipe"}
            email={session.user.email}
            summary={dashboard.summary}
            interactionsCount={dashboard.interactions.length}
            activeMenu="factures"
            searchClients={dashboard.clients}
            searchInteractions={dashboard.interactions}
            searchProjects={dashboard.projects}
        >
            <main className="mx-auto flex w-full max-w-6xl flex-col gap-6">
                <MotionReveal>
                    <section className="flex flex-col gap-4 rounded-[28px] border border-white/70 bg-[#f8f9fd] px-6 py-7 shadow-[0_20px_50px_rgba(29,33,49,0.08)] md:flex-row md:items-center md:justify-between md:px-8">
                        <h1 className="text-2xl font-bold md:text-3xl">Nouvelle facture</h1>
                        <Button asChild variant="outline" className="h-10 rounded-full bg-white px-4">
                            <Link href="/dashboard/factures">
                                <ArrowLeft className="h-4 w-4" />
                                Retour
                            </Link>
                        </Button>
                    </section>
                </MotionReveal>
                <MotionReveal delay={80}>
                    <InvoiceForm currentUserId={currentUserId} clients={clients} />
                </MotionReveal>
            </main>
        </DashboardShell>
    );
}

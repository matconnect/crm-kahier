import { Mail, Phone, ShieldCheck, Users } from "lucide-react";
import { getServerApiBase } from "@/lib/api-base";

type SummaryCardProps = {
    label: string;
    value: string;
    icon: React.ElementType;
};

function SummaryCard({ label, value, icon: Icon }: SummaryCardProps) {
    return (
        <div className="rounded-[1.5rem] border border-[#e1e4ef] bg-white p-4">
            <div className="mb-3 inline-flex rounded-2xl bg-slate-950 p-2 text-amber-300 shadow-[0_10px_24px_rgba(15,23,42,0.16)]">
                <Icon className="h-4 w-4" />
            </div>
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-[#1e2234]">{value}</p>
            <p className="mt-2 text-sm leading-6 text-[#6f7488]">Mise à jour en continu</p>
        </div>
    );
}

export async function ClientsSummary({ currentUserId }: { currentUserId: string }) {
    const apiBase = getServerApiBase();
    let active = 0;
    let prospects = 0;
    let inactive = 0;
    let interactions = 0;

    if (apiBase) {
        try {
            const res = await fetch(`${apiBase}/clients/summary`, {
                cache: "no-store",
                headers: currentUserId ? { "x-user-id": currentUserId } : undefined,
            });
            if (res.ok) {
                const payload = (await res.json()) as {
                    active: number;
                    prospects: number;
                    inactive: number;
                    interactions: number;
                };
                active = payload.active;
                prospects = payload.prospects;
                inactive = payload.inactive;
                interactions = payload.interactions;
            }
        } catch {
            // Keep default values when API is unavailable.
        }
    }

    const cards: SummaryCardProps[] = [
        { label: "Clients actifs", value: String(active), icon: ShieldCheck },
        { label: "Prospects", value: String(prospects), icon: Users },
        { label: "Clients inactifs", value: String(inactive), icon: Phone },
        { label: "Interactions", value: String(interactions), icon: Mail },
    ];

    return (
        <section id="clients-summary" className="space-y-3 scroll-mt-36">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-slate-950">Vue d’ensemble</h2>
                    <p className="text-sm text-slate-600">Comptes actifs, prospects et interactions clés.</p>
                </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {cards.map((item) => (
                    <SummaryCard key={item.label} {...item} />
                ))}
            </div>
        </section>
    );
}

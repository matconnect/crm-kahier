import { Mail, Phone, ShieldCheck, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getServerApiBase } from "@/lib/api-base";

type SummaryCardProps = {
    label: string;
    value: string;
    icon: React.ElementType;
};

function SummaryCard({ label, value, icon: Icon }: SummaryCardProps) {
    return (
        <Card className="crm-card h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-slate-500">{label}</CardTitle>
                <div className="rounded-2xl bg-slate-950 p-2 text-amber-300 shadow-[0_10px_24px_rgba(15,23,42,0.16)]">
                    <Icon className="h-4 w-4" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-semibold text-slate-950">{value}</div>
                <CardDescription className="mt-1 text-xs text-slate-500">Mise à jour en continu</CardDescription>
            </CardContent>
        </Card>
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

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {cards.map((item) => (
                    <SummaryCard key={item.label} {...item} />
                ))}
            </div>
        </section>
    );
}

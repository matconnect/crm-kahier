import { Mail, Phone, ShieldCheck, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type SummaryCardProps = {
    label: string;
    value: string;
    icon: React.ElementType;
};

function SummaryCard({ label, value, icon: Icon }: SummaryCardProps) {
    return (
        <Card className="border-muted/60">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
                <div className="rounded-lg bg-muted/70 p-2">
                    <Icon className="h-4 w-4 text-foreground" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-semibold">{value}</div>
                <CardDescription className="mt-1 text-xs text-muted-foreground">Mise à jour en continu</CardDescription>
            </CardContent>
        </Card>
    );
}

export async function ClientsSummary({ companyId }: { companyId: string }) {
    const apiBase = process.env.NEXT_PUBLIC_API_URL;
    if (!apiBase) {
        throw new Error("NEXT_PUBLIC_API_URL manquant pour récupérer le résumé clients");
    }

    const res = await fetch(`${apiBase}/clients/summary`, {
        cache: "no-store",
        headers: companyId ? { "x-company-id": companyId } : undefined,
    });
    if (!res.ok) {
        throw new Error("Impossible de récupérer le résumé clients");
    }
    const { active, prospects, inactive, interactions } = (await res.json()) as {
        active: number;
        prospects: number;
        inactive: number;
        interactions: number;
    };

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
                    <h2 className="text-lg font-semibold">Vue d’ensemble</h2>
                    <p className="text-sm text-muted-foreground">Comptes actifs, prospects et interactions clés.</p>
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

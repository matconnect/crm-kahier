import type { InteractionItem, SummaryResponse } from "../shared/types";

type FocusCardProps = {
    summary: SummaryResponse;
    interactions: InteractionItem[];
};

function getFocus(summary: SummaryResponse, portfolioSize: number) {
    if (summary.prospects > summary.active) {
        return {
            title: "Priorité du jour",
            description: "Accélérer la conversion des prospects les plus chauds.",
            action: `${summary.prospects} prospect(s) à faire progresser cette semaine.`,
        };
    }

    if (summary.interactions < Math.max(summary.active, 1)) {
        return {
            title: "Priorité du jour",
            description: "Renforcer le rythme de suivi des clients actifs.",
            action: `${summary.interactions} interaction(s) pour ${summary.active} client(s) actif(s).`,
        };
    }

    return {
        title: "Priorité du jour",
        description: "Maintenir une cadence régulière sur les dossiers en cours.",
        action: `${portfolioSize} dossier(s) suivis actuellement dans le portefeuille.`,
    };
}

export function FocusCard({ summary, interactions }: FocusCardProps) {
    const portfolioSize = summary.active + summary.prospects;
    const interactionsPerCase = portfolioSize > 0 ? summary.interactions / portfolioSize : 0;
    const interactionsPerCaseLabel = interactionsPerCase.toLocaleString("fr-FR", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
    });

    const dominantBadge = interactions.reduce<Record<string, number>>((acc, item) => {
        acc[item.badge] = (acc[item.badge] ?? 0) + 1;
        return acc;
    }, {});

    const dominantChannel = Object.entries(dominantBadge).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Aucun";
    const latestInteractionAt = interactions[0]?.occurredAt
        ? new Date(interactions[0].occurredAt).toLocaleString("fr-FR", {
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
          })
        : "Aucune";
    const focus = getFocus(summary, portfolioSize);

    return (
        <section className="rounded-[28px] border border-white/70 bg-white p-5 shadow-[0_20px_50px_rgba(29,33,49,0.08)] md:p-7">
            <p className="text-xs uppercase  text-[#8f93a9]">Portefeuille total</p>
            <p className="mt-3 text-6xl font-black leading-none">{portfolioSize}</p>
            <p className="mt-1 text-sm text-[#6d7288]">
                {summary.active} client(s) actif(s) · {summary.prospects} prospect(s)
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl border border-[#e4e7f2] bg-white px-3 py-2">
                    <p className="text-[11px] uppercase  text-[#8f93a9]">Interactions / dossier</p>
                    <p className="mt-1 font-semibold text-[#2d3145]">{interactionsPerCaseLabel}</p>
                </div>
                <div className="rounded-2xl border border-[#e4e7f2] bg-white px-3 py-2">
                    <p className="text-[11px] uppercase  text-[#8f93a9]">Canal dominant</p>
                    <p className="mt-1 font-semibold text-[#2d3145]">{dominantChannel}</p>
                </div>
                <div className="col-span-2 rounded-2xl border border-[#e4e7f2] bg-white px-3 py-2">
                    <p className="text-[11px] uppercase  text-[#8f93a9]">Dernière interaction</p>
                    <p className="mt-1 font-semibold text-[#2d3145]">{latestInteractionAt}</p>
                </div>
            </div>

            <div className="mt-5 rounded-2xl bg-[#22263a] p-4 text-sm text-white">
                <p className="font-semibold">{focus.title}</p>
                <p className="mt-1 text-white/85">{focus.description}</p>
                <p className="mt-2 text-xs text-white/75">{focus.action}</p>
            </div>
        </section>
    );
}

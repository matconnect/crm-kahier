import type { SummaryResponse } from "../shared/types";

type TeamPerformanceCardProps = {
    summary: SummaryResponse;
};

export function TeamPerformanceCard({ summary }: TeamPerformanceCardProps) {
    return (
        <section
            id="team-performance"
            className="rounded-[28px] border border-white/70 bg-[#f8f9fd] p-5 shadow-[0_20px_50px_rgba(29,33,49,0.08)] md:p-7"
        >
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-[38px] font-bold leading-none ">Performance d’équipe</h2>
                <div className="rounded-2xl border border-[#e1e4ef] bg-white px-4 py-2 text-sm font-semibold">Cette année</div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-[#dde2ef] bg-white p-4">
                    <p className="text-xs uppercase  text-[#8f93a9]">Clients actifs</p>
                    <p className="mt-3 text-4xl font-bold">{summary.active}</p>
                </div>
                <div className="rounded-2xl border border-[#dde2ef] bg-white p-4">
                    <p className="text-xs uppercase  text-[#8f93a9]">Prospects</p>
                    <p className="mt-3 text-4xl font-bold">{summary.prospects}</p>
                </div>
                <div className="rounded-2xl border border-[#dde2ef] bg-white p-4">
                    <p className="text-xs uppercase  text-[#8f93a9]">Interactions</p>
                    <p className="mt-3 text-4xl font-bold">{summary.interactions}</p>
                </div>
            </div>
        </section>
    );
}

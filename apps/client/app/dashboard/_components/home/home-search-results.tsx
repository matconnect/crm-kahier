import Link from "next/link";

import { formatTime } from "../shared/formatters";
import type { ClientSearchItem, InteractionItem, ProjectSearchItem } from "../shared/types";

type HomeSearchResultsProps = {
    query: string;
    clients: ClientSearchItem[];
    interactions: InteractionItem[];
    projects: ProjectSearchItem[];
};

export function HomeSearchResults({ query, clients, interactions, projects }: HomeSearchResultsProps) {
    const total = clients.length + interactions.length + projects.length;

    return (
        <section className="rounded-[28px] border border-white/70 bg-white p-5 shadow-[0_20px_50px_rgba(29,33,49,0.08)] md:p-6">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-[#8f93a9]">Recherche globale</p>
                    <h2 className="mt-2 text-2xl font-bold text-[#1f2335]">Résultats pour “{query}”</h2>
                    <p className="mt-1 text-sm text-[#6f7488]">{total} résultat(s) trouvé(s).</p>
                </div>
                <Link href="/dashboard" className="rounded-xl border border-[#d7dced] bg-[#f8f9fd] px-4 py-2 text-sm font-semibold text-[#434965]">
                    Réinitialiser
                </Link>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-3">
                <article className="rounded-2xl border border-[#e4e7f2] bg-[#fafbff] p-4">
                    <h3 className="text-sm font-semibold text-[#2f3344]">Clients ({clients.length})</h3>
                    <div className="mt-3 space-y-2">
                        {clients.length === 0 ? (
                            <p className="text-sm text-[#8f93a9]">Aucun client correspondant.</p>
                        ) : (
                            clients.slice(0, 8).map((client) => (
                                <Link
                                    key={client.id}
                                    href={`/dashboard/clients/${client.id}`}
                                    className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm font-semibold text-[#2f3344] hover:bg-[#f4f6fb]"
                                >
                                    <span className="truncate">{client.name}</span>
                                    <span className="text-xs text-[#8f93a9]">{client.interactionsCount}</span>
                                </Link>
                            ))
                        )}
                    </div>
                </article>

                <article className="rounded-2xl border border-[#e4e7f2] bg-[#fafbff] p-4">
                    <h3 className="text-sm font-semibold text-[#2f3344]">Interactions ({interactions.length})</h3>
                    <div className="mt-3 space-y-2">
                        {interactions.length === 0 ? (
                            <p className="text-sm text-[#8f93a9]">Aucune interaction correspondante.</p>
                        ) : (
                            interactions.slice(0, 8).map((interaction) => (
                                <Link
                                    key={interaction.id}
                                    href={`/dashboard/clients/${interaction.clientId}`}
                                    className="block rounded-xl bg-white px-3 py-2 hover:bg-[#f4f6fb]"
                                >
                                    <p className="truncate text-sm font-semibold text-[#2f3344]">{interaction.clientName}</p>
                                    <p className="truncate text-xs text-[#6f7488]">{interaction.summary}</p>
                                    <p className="mt-1 text-[11px] font-semibold text-[#8f93a9]">{formatTime(interaction.occurredAt)} · {interaction.type}</p>
                                </Link>
                            ))
                        )}
                    </div>
                </article>

                <article className="rounded-2xl border border-[#e4e7f2] bg-[#fafbff] p-4">
                    <h3 className="text-sm font-semibold text-[#2f3344]">Projets ({projects.length})</h3>
                    <div className="mt-3 space-y-2">
                        {projects.length === 0 ? (
                            <p className="text-sm text-[#8f93a9]">Aucun projet correspondant.</p>
                        ) : (
                            projects.slice(0, 8).map((project) => (
                                <Link
                                    key={project.id}
                                    href={`/dashboard/projects/${project.id}`}
                                    className="block rounded-xl bg-white px-3 py-2 hover:bg-[#f4f6fb]"
                                >
                                    <p className="truncate text-sm font-semibold text-[#2f3344]">{project.name}</p>
                                    <p className="truncate text-xs text-[#6f7488]">{project.description || project.clientName}</p>
                                </Link>
                            ))
                        )}
                    </div>
                </article>
            </div>
        </section>
    );
}

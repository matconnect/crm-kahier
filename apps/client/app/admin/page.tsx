import { requireRole } from "@/lib/authz";
import type { Role } from "@/lib/roles";
import { MotionReveal } from "@/components/motion/reveal";

export default async function AdminPage() {
    const session = await requireRole("ADMIN" as Role);

    return (
        <div className="app-shell min-h-screen px-6 py-10">
            <div className="mx-auto flex max-w-5xl flex-col gap-6">
                <MotionReveal>
                <section className="surface-hero rounded-[2rem] px-6 py-8 md:px-8">
                    <div className="relative space-y-3">
                        <p className="section-kicker text-slate-300">Administration</p>
                        <h1 className="display-title text-3xl">Console administrateur</h1>
                        <p className="text-sm text-slate-300">Accès autorisé pour le rôle ADMIN.</p>
                    </div>
                </section>
                </MotionReveal>

                <MotionReveal delay={90}>
                <section className="surface-panel rounded-[2rem] p-5 md:p-6">
                    <pre className="overflow-x-auto text-sm text-slate-700">{JSON.stringify(session, null, 2)}</pre>
                </section>
                </MotionReveal>
            </div>
        </div>
    );
}

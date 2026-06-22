import { requireRole } from "@/lib/authz";
import type { Role } from "@/lib/roles";
import { MotionReveal } from "@/components/motion/reveal";

export default async function AdminPage() {
    const session = await requireRole("ADMIN" as Role);

    return (
        <div className="bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(241,245,249,0.94))] min-h-screen px-6 py-10">
            <div className="mx-auto flex max-w-5xl flex-col gap-6">
                <MotionReveal>
                <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 px-6 py-8 text-slate-50 shadow-[0_30px_90px_rgba(15,23,42,0.18)] md:px-8">
                    <div className="relative space-y-3">
                        <p className="text-xs uppercase text-slate-300">Administration</p>
                        <h1 className="font-black text-3xl">Console administrateur</h1>
                        <p className="text-sm text-slate-300">Accès autorisé pour le rôle ADMIN.</p>
                    </div>
                </section>
                </MotionReveal>

                <MotionReveal delay={90}>
                <section className="border border-slate-200 bg-white/90 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl transition rounded-[2rem] p-5 md:p-6">
                    <pre className="overflow-x-auto text-sm text-slate-700">{JSON.stringify(session, null, 2)}</pre>
                </section>
                </MotionReveal>
            </div>
        </div>
    );
}

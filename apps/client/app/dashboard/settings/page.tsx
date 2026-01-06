import Link from "next/link";
import { DashboardTopBar } from "@/components/dashboard/top-bar";

import { CompanySection } from "../_components/company-section";
import { ProfileSection } from "../_components/profile-section";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SettingsPage() {

    return (
        <div className="min-h-screen bg-background">
            <DashboardTopBar
                subtitle="Paramètres"
                anchors={[
                    { label: "Profil", href: "#profile" },
                    { label: "Entreprise", href: "#company" },
                ]}
            />
            <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10">
                <div className="flex flex-col gap-2">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Paramètres organisation</h1>
                        <p className="text-sm text-muted-foreground">
                            Gérez l&apos;entreprise, partagez le code d&apos;invitation et consultez les rôles des membres.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Link href="/dashboard/clients" className="underline">
                            Voir les clients
                        </Link>
                    </div>
                </div>

                <div id="profile" className="scroll-mt-24">
                    <ProfileSection />
                </div>

                <div id="company" className="scroll-mt-24">
                    <CompanySection />
                </div>
            </div>
        </div>
    );
}

import { requireAuth } from "@/lib/authz";
import { DashboardTopBar } from "@/components/dashboard/top-bar";
import { ActivitySection } from "./_components/activity-section";
import { DashboardHeader } from "./_components/dashboard-header";
import { StatsSection } from "./_components/stats-section";

export default async function DashboardPage() {
    const session = await requireAuth();
    const currentUserId = session.user?.id ?? "";

    return (
        <div className="min-h-screen bg-background">
            <DashboardTopBar
                subtitle="Dashboard"
                anchors={[
                    { label: "Vue d’ensemble", href: "#stats" },
                    { label: "Activités", href: "#activity" },
                ]}
            />
            <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
                <DashboardHeader session={session} />
                <StatsSection currentUserId={currentUserId} />
                <ActivitySection currentUserId={currentUserId} />
            </div>
        </div>
    );
}

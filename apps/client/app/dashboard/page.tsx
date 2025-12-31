import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/LogoutButton";

export default async function DashboardPage() {
    const session = await auth();
    if (!session) redirect("/login");

    return (
        <div style={{ padding: 24 }}>
            <h1>Dashboard</h1>

            <pre style={{ marginTop: 16 }}>
                {JSON.stringify(session, null, 2)}
            </pre>

            <LogoutButton />
        </div>
    );
}

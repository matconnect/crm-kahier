import { requireRole } from "@/lib/authz";
import type { Role } from "@/lib/roles";

export default async function AdminPage() {
    const session = await requireRole("ADMIN" as Role);

    return (
        <div style={{ padding: 24 }}>
            <h1>Admin</h1>
            <p>Accès autorisé (ADMIN)</p>
            <pre style={{ marginTop: 16 }}>{JSON.stringify(session, null, 2)}</pre>
        </div>
    );
}

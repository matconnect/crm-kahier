import { NextResponse } from "next/server";
import { getServerApiBase } from "@/lib/api-base";

export async function POST(req: Request) {
    const apiBase = getServerApiBase();
    if (!apiBase) {
        return NextResponse.json({ error: "API interne non configurée." }, { status: 500 });
    }

    const body = await req.json();
    const res = await fetch(`${apiBase}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => null)) as Record<string, unknown> | null;

    return NextResponse.json(data ?? { error: "Réponse invalide du service auth." }, { status: res.status });
}

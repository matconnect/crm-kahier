import { NextResponse } from "next/server";
import { getServerApiBase } from "@/lib/api-base";

export async function GET() {
    const apiBase = getServerApiBase();
    if (!apiBase) {
        return NextResponse.json({ ok: false, error: "API interne non configurée." }, { status: 500 });
    }

    const res = await fetch(`${apiBase}/health`, { cache: "no-store" });
    if (!res.ok) {
        return NextResponse.json({ ok: false }, { status: 503 });
    }
    return NextResponse.json({ ok: true });
}

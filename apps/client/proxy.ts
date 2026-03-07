import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authFromRequest } from "@/lib/session";

export async function proxy(request: NextRequest) {
    const session = await authFromRequest(request);
    const pathname = request.nextUrl.pathname;

    //SECTION Middleware d'auth
    //NOTE //* Routes protégées - Authentification uniquement
    const protectedPaths = pathname.startsWith("/dashboard") || pathname.startsWith("/admin");

    if (protectedPaths && !session) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    //NOTE //* Routes protégées - Admin uniquement
    if (pathname.startsWith("/admin")) {
        const role = session?.user?.role;
        if (role !== "ADMIN") {
            return NextResponse.redirect(new URL("/dashboard", request.url));
        }
    }

    //!SECTION Fin du middleware d'authentification et d'autorisation

    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*", "/admin/:path*"],
};

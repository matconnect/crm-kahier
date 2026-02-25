import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { JWT } from "next-auth/jwt";
import type { Session, User } from "next-auth";
import { getServerApiBase } from "@/lib/api-base";

const authConfig: Parameters<typeof NextAuth>[0] = {
    trustHost: true,
    session: { strategy: "jwt" },

    providers: [
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Mot de passe", type: "password" },
            },
            async authorize(credentials) {
                const email =
                    typeof credentials?.email === "string"
                        ? credentials.email.trim().toLowerCase()
                        : null;

                const password =
                    typeof credentials?.password === "string" ? credentials.password : null;

                if (!email || !password) return null;
                const apiBase = getServerApiBase();
                if (!apiBase) return null;

                const res = await fetch(`${apiBase}/auth/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password }),
                });
                const data = (await res.json().catch(() => null)) as
                    | {
                        user?: {
                            id: string;
                            email: string;
                            firstName: string;
                            lastName: string;
                            role: string;
                            companyId: string | null;
                        };
                    }
                    | null;
                if (!res.ok || !data?.user) return null;

                return {
                    id: data.user.id,
                    email: data.user.email,
                    firstName: data.user.firstName,
                    lastName: data.user.lastName,
                    role: data.user.role,
                    companyId: data.user.companyId ?? null,
                } as unknown as User;
            },
        }),
    ],

    callbacks: {
        async jwt({ token, user }: { token: JWT; user?: User | null }) {
            if (user) {
                token.sub = user.id;
                (token as JWT & { role?: string }).role = (user as User & { role?: string }).role;
                (token as JWT & { companyId?: string | null }).companyId = (user as User & { companyId?: string | null }).companyId ?? null;
            }
            return token;
        },

        async session({ session, token }: { session: Session; token: JWT }) {
            session.user = session.user ?? ({} as Session["user"]);
            (session.user as Session["user"] & { id?: string }).id = token.sub ?? "";
            (session.user as Session["user"] & { role?: string }).role = (token as JWT & { role?: string }).role;
            (session.user as Session["user"] & { companyId?: string | null }).companyId = (token as JWT & { companyId?: string | null }).companyId ?? null;
            return session;
        },
    },
};

type AuthHandler = ReturnType<typeof NextAuth>;
const authHandler: AuthHandler = NextAuth(authConfig);

export const handlers: AuthHandler["handlers"] = authHandler.handlers;
export const auth: AuthHandler["auth"] = authHandler.auth;
export const signIn: AuthHandler["signIn"] = authHandler.signIn;
export const signOut: AuthHandler["signOut"] = authHandler.signOut;

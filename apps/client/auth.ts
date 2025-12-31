import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@kahier/db";
import type { JWT } from "next-auth/jwt";
import type { Session, User } from "next-auth";

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

                const dbUser = await prisma.user.findUnique({ where: { email } });
                if (!dbUser) return null;

                const ok = await bcrypt.compare(password, dbUser.password);
                if (!ok) return null;

                return {
                    id: dbUser.id,
                    email: dbUser.email,
                    name: dbUser.name ?? undefined,
                    role: dbUser.role,
                } as unknown as User;
            },
        }),
    ],

    callbacks: {
        async jwt({ token, user }: { token: JWT; user?: User | null }) {
            if (user) {
                token.sub = user.id;
                (token as JWT & { role?: string }).role = (user as User & { role?: string }).role;
            }
            return token;
        },

        async session({ session, token }: { session: Session; token: JWT }) {
            session.user = session.user ?? ({} as Session["user"]);
            (session.user as Session["user"] & { id?: string }).id = token.sub ?? "";
            (session.user as Session["user"] & { role?: string }).role = (token as JWT & { role?: string }).role;
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

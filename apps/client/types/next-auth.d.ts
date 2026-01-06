import "next-auth";
import "next-auth/jwt";
import type { Role } from "@prisma/client";

declare module "next-auth" {
    interface User {
        role?: Role;
        companyId?: string | null;
    }

    interface Session {
        user: {
            id: string;
            email?: string | null;
            name?: string | null;
            role?: Role;
            companyId?: string | null;
        };
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        role?: Role;
        companyId?: string | null;
    }
}

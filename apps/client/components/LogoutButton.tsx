"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

import { Button } from "./ui/button";

type LogoutButtonProps = React.ComponentProps<typeof Button>;

export function LogoutButton({ children = "Déconnexion", ...props }: LogoutButtonProps) {
    return (
        <Button
            variant="outline"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="gap-2"
            {...props}
        >
            <LogOut className="h-4 w-4" />
            {children}
        </Button>
    );
}

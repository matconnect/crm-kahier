"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { logoutAction } from "@/app/(auth)/actions";

import { Button } from "./ui/button";

type LogoutButtonProps = React.ComponentProps<typeof Button>;

export function LogoutButton({ children = "Déconnexion", ...props }: LogoutButtonProps) {
    const router = useRouter();

    async function handleLogout() {
        await logoutAction();
        router.push("/login");
        router.refresh();
    }

    return (
        <Button
            variant="outline"
            onClick={handleLogout}
            className="gap-2"
            {...props}
        >
            <LogOut className="h-4 w-4" />
            {children}
        </Button>
    );
}

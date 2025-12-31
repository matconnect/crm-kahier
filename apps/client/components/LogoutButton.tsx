"use client";

import { signOut } from "next-auth/react";

export function LogoutButton() {
    return (
        <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            style={{
                marginTop: 16,
                padding: "8px 12px",
                borderRadius: 6,
                background: "#ef4444",
                color: "white",
                border: "none",
                cursor: "pointer",
            }}
        >
            Déconnexion
        </button>
    );
}

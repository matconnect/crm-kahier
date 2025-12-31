"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    return (
        <div style={{ maxWidth: 360, margin: "40px auto" }}>
            <h1>Connexion</h1>

            <input
                style={{ width: "100%", marginTop: 12, padding: 10 }}
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />

            <input
                style={{ width: "100%", marginTop: 12, padding: 10 }}
                placeholder="Mot de passe"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />

            <button
                style={{ width: "100%", marginTop: 16, padding: 10 }}
                onClick={() => signIn("credentials", { email, password, callbackUrl: "/dashboard" })}
            >
                Se connecter
            </button>
        </div>
    );
}

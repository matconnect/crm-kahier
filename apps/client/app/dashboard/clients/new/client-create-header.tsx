"use client";

import Link from "next/link";
import * as React from "react";
import { LayoutGrid, Save } from "lucide-react";

import { Button } from "@/components/ui/button";

type Props = {
    formId: string;
};

export function ClientCreateHeader({ formId }: Props) {
    const [compact, setCompact] = React.useState(false);

    React.useEffect(() => {
        const onScroll = () => setCompact(window.scrollY > 8);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const shellClasses = [
        "rounded-[28px] border border-white/70 bg-[#f8f9fd]/95 backdrop-blur-sm",
        "px-6 py-7 md:px-8",
        "shadow-[0_20px_50px_rgba(29,33,49,0.08)]",
        "transition-all duration-300 ease-out",
        compact ? "scale-[0.992] shadow-[0_14px_34px_rgba(29,33,49,0.10)]" : "scale-100",
    ].join(" ");

    function HeaderContent() {
        return (
            <div className={shellClasses}>
                <div className="relative flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold md:text-3xl">Nouveau client</h1>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Link
                            href="/dashboard/clients"
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#d7dced] bg-white px-4 text-sm font-medium text-[#2f3344] shadow-sm hover:bg-[#f8f9fd]"
                        >
                            <LayoutGrid className="h-4 w-4" />
                            Retour liste
                        </Link>
                        <Button asChild className="h-10 rounded-full border-0 bg-[#111322] px-4 text-white hover:bg-[#191d2e]">
                            <button type="submit" form={formId}>
                                <Save className="h-4 w-4" />
                                Créer le client
                            </button>
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className={compact ? "pointer-events-none opacity-0" : "opacity-100 transition-opacity duration-300 ease-out"}>
                <HeaderContent />
            </div>
            <div
                className={[
                    "fixed left-4 right-4 top-4 z-40 lg:left-[calc(300px+2rem)] lg:right-[2rem]",
                    "transition-all duration-300 ease-out",
                    compact ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0",
                ].join(" ")}
                aria-hidden={!compact}
            >
                <HeaderContent />
            </div>
        </>
    );
}

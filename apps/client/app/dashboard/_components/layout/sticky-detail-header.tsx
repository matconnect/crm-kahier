"use client";

import Link from "next/link";
import * as React from "react";

type Props = {
    title: string;
    subtitle?: string;
    badgeLabel?: string;
    returnHref: string;
    returnLabel: string;
    actions: React.ReactNode;
};

function DetailShell({ title, subtitle, badgeLabel, returnHref, returnLabel, actions }: Props) {
    const compact = React.useContext(CompactContext);

    return (
        <div
            className={[
                "mb-5 rounded-[28px] border border-white/70 bg-[#f8f9fd]/95 px-6 py-8 backdrop-blur-sm md:mb-6 md:px-8 md:py-9",
                "transition-all duration-300 ease-out",
                compact ? "scale-[0.992] shadow-[0_14px_34px_rgba(29,33,49,0.10)]" : "scale-100 shadow-[0_20px_50px_rgba(29,33,49,0.08)]",
            ].join(" ")}
        >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="truncate text-2xl font-bold md:text-3xl">{title}</h1>
                        {badgeLabel ? (
                            <span className="inline-flex h-7 items-center rounded-full border border-[#dde2eb] bg-white px-3 text-xs font-semibold text-[#3a4054]">
                                {badgeLabel}
                            </span>
                        ) : null}
                    </div>
                    {subtitle ? <p className="mt-2 truncate text-sm text-slate-500">{subtitle}</p> : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Link
                        href={returnHref}
                        className="inline-flex h-10 items-center justify-center rounded-full border border-[#d7dced] bg-white px-4 text-sm font-medium text-[#2f3344] shadow-sm hover:bg-[#f8f9fd]"
                    >
                        {returnLabel}
                    </Link>
                    {actions}
                </div>
            </div>
        </div>
    );
}

const CompactContext = React.createContext(false);

export function StickyDetailHeader(props: Props) {
    const [compact, setCompact] = React.useState(false);

    React.useEffect(() => {
        const onScroll = () => setCompact(window.scrollY > 8);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <CompactContext.Provider value={compact}>
            <div
                className={[
                    "overflow-hidden transition-all duration-300 ease-out",
                    compact ? "pointer-events-none mb-0 max-h-0 opacity-0" : "mb-0 max-h-[420px] opacity-100",
                ].join(" ")}
            >
                <DetailShell {...props} />
            </div>
            <div
                className={[
                    "fixed left-4 right-4 top-0 z-40 lg:left-[calc(300px+2rem)] lg:right-[2rem]",
                    "transition-all duration-300 ease-out",
                    compact ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
                ].join(" ")}
                style={{
                    transform: compact
                        ? "translateY(calc(var(--dashboard-top-header-height, 88px) + 1rem))"
                        : "translateY(calc(var(--dashboard-top-header-height, 88px) - 0.25rem))",
                }}
                aria-hidden={!compact}
            >
                <DetailShell {...props} />
            </div>
        </CompactContext.Provider>
    );
}

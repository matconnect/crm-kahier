"use client";

import Link from "next/link";
import * as React from "react";
import { ArrowLeft, Eye, LayoutGrid, Save } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

type Props = {
    title: string;
    returnHref: string;
    returnLabel: string;
    submitLabel: string;
    formId: string;
    returnIcon: "arrow-left" | "layout-grid";
    submitIcon: "save";
    extraAction?: React.ReactNode;
    secondaryLabel?: string;
    secondaryIcon?: "eye";
    onSecondaryClick?: () => void;
};

const returnIcons: Record<Props["returnIcon"], LucideIcon> = {
    "arrow-left": ArrowLeft,
    "layout-grid": LayoutGrid,
};

const submitIcons: Record<Props["submitIcon"], LucideIcon> = {
    save: Save,
};

const secondaryIcons: Record<NonNullable<Props["secondaryIcon"]>, LucideIcon> = {
    eye: Eye,
};

function HeaderShell({
    title,
    returnHref,
    returnLabel,
    submitLabel,
    formId,
    returnIcon,
    submitIcon,
    extraAction,
    secondaryLabel,
    secondaryIcon,
    onSecondaryClick,
}: Props) {
    const ReturnIcon = returnIcons[returnIcon];
    const SubmitIcon = submitIcons[submitIcon];
    const SecondaryIcon = secondaryIcon ? secondaryIcons[secondaryIcon] : null;
    return (
        <div className="rounded-[28px] border border-white/70 bg-[#f8f9fd]/95 px-6 py-7 shadow-[0_20px_50px_rgba(29,33,49,0.08)] backdrop-blur-sm md:px-8">
            <div className="relative flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {extraAction}
                    {secondaryLabel && onSecondaryClick ? (
                        <Button
                            type="button"
                            variant="outline"
                            className="h-10 rounded-full bg-white px-4"
                            onClick={onSecondaryClick}
                        >
                            {SecondaryIcon ? <SecondaryIcon className="h-4 w-4" /> : null}
                            {secondaryLabel}
                        </Button>
                    ) : null}
                    <Link
                        href={returnHref}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#d7dced] bg-white px-4 text-sm font-medium text-[#2f3344] shadow-sm hover:bg-[#f8f9fd]"
                    >
                        <ReturnIcon className="h-4 w-4" />
                        {returnLabel}
                    </Link>
                    <Button asChild className="h-10 rounded-full border-0 bg-[#111322] px-4 text-white hover:bg-[#191d2e]">
                        <button type="submit" form={formId}>
                            <SubmitIcon className="h-4 w-4" />
                            {submitLabel}
                        </button>
                    </Button>
                </div>
            </div>
        </div>
    );
}

export function FormPageHeader(props: Props) {
    const [compact, setCompact] = React.useState(false);

    React.useEffect(() => {
        const onScroll = () => setCompact(window.scrollY > 8);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <>
            <div className={compact ? "pointer-events-none opacity-0" : "opacity-100 transition-opacity duration-300 ease-out"}>
                <HeaderShell {...props} />
            </div>
            <div
                className={[
                    "fixed left-4 right-4 top-4 z-40 lg:left-[calc(300px+2rem)] lg:right-[2rem]",
                    "transition-all duration-300 ease-out",
                    compact ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0",
                ].join(" ")}
                aria-hidden={!compact}
            >
                <HeaderShell {...props} />
            </div>
        </>
    );
}

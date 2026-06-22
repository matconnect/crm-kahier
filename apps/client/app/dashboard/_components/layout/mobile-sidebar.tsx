"use client";

import { useState } from "react";
import { Menu } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SidebarMenuPanel, type SidebarMenuProps } from "./sidebar-menu";

export function MobileSidebar(props: SidebarMenuProps) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button
                    type="button"
                    className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-[#dde2eb] bg-white text-[#11131d] shadow-[0_8px_22px_rgba(28,35,54,0.04)] transition hover:bg-[#f8f9fc] lg:hidden"
                    aria-label="Ouvrir le menu"
                >
                    <Menu className="h-5 w-5" />
                </button>
            </DialogTrigger>

            <DialogContent
                hideCloseButton
                className="left-0 top-0 h-[100dvh] w-[min(88vw,320px)] max-w-[320px] translate-x-0 translate-y-0 rounded-none border-0 border-r border-[#e6e9f0] bg-white p-0 shadow-[0_24px_80px_rgba(31,38,58,0.18)] duration-200 data-[state=closed]:slide-out-to-left data-[state=closed]:slide-out-to-top-0 data-[state=open]:slide-in-from-left data-[state=open]:slide-in-from-top-0"
            >
                <DialogHeader className="sr-only">
                    <DialogTitle>Navigation</DialogTitle>
                </DialogHeader>

                <div className="h-full overflow-y-auto p-4">
                    <SidebarMenuPanel {...props} onNavigate={() => setOpen(false)} />
                </div>
            </DialogContent>
        </Dialog>
    );
}

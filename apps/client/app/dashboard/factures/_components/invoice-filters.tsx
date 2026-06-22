"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { INVOICE_STATUS_OPTIONS } from "../_lib/invoices";

export function InvoiceFilters({ initialQuery = "", initialStatus = "" }: { initialQuery?: string; initialStatus?: string }) {
    const router = useRouter();
    const [query, setQuery] = React.useState(initialQuery);
    const [status, setStatus] = React.useState(initialStatus || "all");
    const [isPending, startTransition] = React.useTransition();

    React.useEffect(() => {
        setQuery(initialQuery);
    }, [initialQuery]);

    React.useEffect(() => {
        setStatus(initialStatus || "all");
    }, [initialStatus]);

    React.useEffect(() => {
        const timer = window.setTimeout(() => {
            const params = new URLSearchParams();
            const trimmedQuery = query.trim();
            if (trimmedQuery) params.set("q", trimmedQuery);
            if (status !== "all") params.set("status", status);
            startTransition(() => {
                router.replace(`/dashboard/factures${params.size ? `?${params.toString()}` : ""}`);
            });
        }, 250);

        return () => window.clearTimeout(timer);
    }, [query, router, startTransition, status]);

    return (
        <div className="mb-5 grid gap-3 md:grid-cols-[minmax(240px,1fr)_190px]">
            <label className="relative">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Numéro ou client"
                    className="h-10 rounded-xl bg-white pl-10"
                />
            </label>
            <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-10 w-full rounded-xl bg-white">
                    <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    {INVOICE_STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {isPending ? <span className="sr-only">Filtrage en cours</span> : null}
        </div>
    );
}

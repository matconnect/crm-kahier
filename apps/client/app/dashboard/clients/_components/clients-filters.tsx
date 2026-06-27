"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import { CLIENT_SEGMENT_OPTIONS, CLIENT_STATUS_OPTIONS } from "@/lib/client-enums";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type FiltersProps = {
    searchParams: {
        q?: string;
        status?: string;
        segment?: string;
    };
};

function getInitialStatus(value?: string): string {
    return value && CLIENT_STATUS_OPTIONS.some((option) => option.value === value) ? value : "all";
}

function getInitialSegment(value?: string): string {
    return value && CLIENT_SEGMENT_OPTIONS.some((option) => option.value === value) ? value : "all";
}

export function ClientsFilters({ searchParams }: FiltersProps) {
    const router = useRouter();
    const [query, setQuery] = React.useState(searchParams.q ?? "");
    const [status, setStatus] = React.useState(getInitialStatus(searchParams.status));
    const [segment, setSegment] = React.useState(getInitialSegment(searchParams.segment));
    const [isPending, startTransition] = React.useTransition();

    React.useEffect(() => {
        setQuery(searchParams.q ?? "");
    }, [searchParams.q]);

    React.useEffect(() => {
        setStatus(getInitialStatus(searchParams.status));
    }, [searchParams.status]);

    React.useEffect(() => {
        setSegment(getInitialSegment(searchParams.segment));
    }, [searchParams.segment]);

    React.useEffect(() => {
        const timer = window.setTimeout(() => {
            const params = new URLSearchParams();
            const trimmedQuery = query.trim();

            if (trimmedQuery) params.set("q", trimmedQuery);
            if (status !== "all") params.set("status", status);
            if (segment !== "all") params.set("segment", segment);

            startTransition(() => {
                router.replace(`/dashboard/clients${params.size ? `?${params.toString()}` : ""}`);
            });
        }, 250);

        return () => window.clearTimeout(timer);
    }, [query, router, segment, startTransition, status]);

    return (
        <div className="mb-5 grid gap-3 md:grid-cols-[minmax(240px,1fr)_190px_190px]">
            <label className="relative">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Nom du client ou contact"
                    className="h-10 rounded-xl bg-white pl-10"
                />
            </label>
            <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-10 w-full rounded-xl bg-white">
                    <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    {CLIENT_STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select value={segment} onValueChange={setSegment}>
                <SelectTrigger className="h-10 w-full rounded-xl bg-white">
                    <SelectValue placeholder="Tous les segments" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Tous les segments</SelectItem>
                    {CLIENT_SEGMENT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {isPending ? <span className="sr-only">Filtrage en cours</span> : null}
        </div>
    );
}

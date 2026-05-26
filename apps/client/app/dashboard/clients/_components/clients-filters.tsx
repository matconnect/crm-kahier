"use client";

import { useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Filter, MapPin, Search, SlidersHorizontal, Tag } from "lucide-react";
import { CLIENT_SEGMENT_OPTIONS, CLIENT_STATUS_OPTIONS } from "@/lib/client-enums";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type FiltersProps = {
    searchParams: {
        q?: string;
        status?: string;
        segment?: string;
        location?: string;
    };
};

const statusOptions = CLIENT_STATUS_OPTIONS;
const segmentOptions = CLIENT_SEGMENT_OPTIONS;

const locationOptions = ["France", "Belgique", "Suisse", "Luxembourg"];

function isValidStatus(value?: string) {
    return value && ["ACTIVE", "INACTIVE", "PROSPECT"].includes(value);
}

function isValidSegment(value?: string) {
    return value && ["TPE", "PME", "ETI", "GE", "OTHER"].includes(value);
}

export function ClientsFilters({ searchParams }: FiltersProps) {
    const router = useRouter();
    const urlParams = useSearchParams();
    const [pending, startTransition] = useTransition();
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    const [q, setQ] = useState(searchParams.q ?? "");
    const [status, setStatus] = useState<string | undefined>(isValidStatus(searchParams.status) ? searchParams.status : undefined);
    const [segment, setSegment] = useState<string | undefined>(
        isValidSegment(searchParams.segment) ? searchParams.segment : undefined,
    );
    const [location, setLocation] = useState<string | undefined>(searchParams.location);

    useEffect(() => {
        const nextQ = urlParams.get("q") ?? "";
        const nextStatus = urlParams.get("status") ?? undefined;
        const nextSegment = urlParams.get("segment") ?? undefined;
        const nextLocation = urlParams.get("location") ?? undefined;

        setQ(nextQ);
        setStatus(isValidStatus(nextStatus) ? nextStatus : undefined);
        setSegment(isValidSegment(nextSegment) ? nextSegment : undefined);
        setLocation(nextLocation || undefined);
    }, [urlParams]);

    const activeFilters = useMemo(() => {
        const items: { label: string; value: string; icon?: ReactNode }[] = [];
        if (status) items.push({ label: "Statut", value: status });
        if (segment) items.push({ label: "Segment", value: segment });
        return items;
    }, [status, segment, location]);

    function pushFilters(nextQ = q, nextStatus = status, nextSegment = segment, nextLocation = location) {
        const params = new URLSearchParams();
        params.set("page", "1");
        if (nextQ.trim()) params.set("q", nextQ.trim());
        if (nextStatus) params.set("status", nextStatus);
        if (nextSegment) params.set("segment", nextSegment);
        if (nextLocation) params.set("location", nextLocation);

        startTransition(() => {
            router.replace(`/dashboard/clients${params.toString() ? `?${params.toString()}` : ""}`);
        });
    }

    function resetFilters() {
        startTransition(() => {
            router.replace("/dashboard/clients");
        });
    }

    // Auto-apply on dropdown change
    useEffect(() => {
        pushFilters(q, status, segment, location);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status, segment, location]);

    // Debounced apply on search text
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            pushFilters(q, status, segment, location);
        }, 300);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [q]);

    return (
        <section id="clients-filters" className="space-y-3 scroll-mt-36">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                    <h2 className="text-lg font-semibold text-slate-950">Filtres</h2>
                    <p className="text-sm text-slate-600">Affinez par statut, segment.</p>
                </div>
                <Badge variant="secondary" className="gap-1 bg-orange-50 text-orange-700">
                    <Filter className="h-3 w-3" />
                    Vue filtrée
                </Badge>
            </div>

            <Card className="crm-card">
                <CardContent className="flex gap-4 p-4 sm:flex-row flex-col">
                    <div className="space-y-2">
                        <Label htmlFor="search">Recherche</Label>
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                id="search"
                                placeholder="Nom du client ou contact"
                                className="pl-9"
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex justify-between sm:gap-4">
                        <div className="space-y-2">
                            <Label>Statut</Label>
                            <Select value={status ?? ""} onValueChange={(v) => setStatus(v || undefined)}>
                                <SelectTrigger className="w-[80%] sm:w-full">
                                    <SelectValue placeholder="Choisir un statut" />
                                </SelectTrigger>
                                <SelectContent>
                                    {statusOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Segment</Label>
                            <Select value={segment ?? ""} onValueChange={(v) => setSegment(v || undefined)}>
                                <SelectTrigger className="w-[80%] sm:w-full">
                                    <SelectValue placeholder="Choisir un segment" />
                                </SelectTrigger>
                                <SelectContent>
                                    {segmentOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/70 px-4 py-3">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <SlidersHorizontal className="h-4 w-4" />
                        {activeFilters.length} filtre{activeFilters.length > 1 ? "s" : ""} actif{activeFilters.length > 1 ? "s" : ""}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {activeFilters.map((f) => (
                            <Badge key={f.label} variant="outline" className="gap-1 border-slate-300 bg-white/70">
                                {f.label === "Localisation" ? (
                                    <MapPin className="h-3 w-3" />
                                ) : (
                                    <Tag className="h-3 w-3" />
                                )}
                                {f.value}
                            </Badge>
                        ))}
                        <Button variant="ghost" size="sm" className="rounded-full" onClick={resetFilters} disabled={pending}>
                            Réinitialiser
                        </Button>
                    </div>
                </div>
            </Card>
        </section>
    );
}

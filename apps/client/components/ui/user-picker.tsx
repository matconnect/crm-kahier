"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export type PickerOption = {
    id: string;
    label: string;
    email?: string | null;
};

type UserPickerProps = {
    label: string;
    options: PickerOption[];
    selectedIds: string[];
    onChange: (next: string[]) => void;
    placeholder: string;
    allowMulti?: boolean;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    query: string;
    onQueryChange: (value: string) => void;
    emptyMessage: string;
    searchPlaceholder: string;
};

function normalizeSearch(value: string) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

export function UserPicker({
    label,
    options,
    selectedIds,
    onChange,
    placeholder,
    allowMulti = true,
    open,
    onOpenChange,
    query,
    onQueryChange,
    emptyMessage,
    searchPlaceholder,
}: UserPickerProps) {
    const filtered = React.useMemo(() => {
        const normalized = normalizeSearch(query);
        if (normalized.length === 0) return options;
        return options.filter((opt) => normalizeSearch(opt.label ?? "").includes(normalized));
    }, [options, query]);

    const selectedLabel = selectedIds.length
        ? options
              .filter((user) => selectedIds.includes(user.id))
              .slice(0, allowMulti ? 3 : 1)
              .map((user) => user.label)
              .join(", ")
        : placeholder;

    return (
        <div className="space-y-2">
            <Label>
                {label}
                {allowMulti && selectedIds.length > 0
                    ? ` · ${selectedIds.length} sélectionné${selectedIds.length > 1 ? "s" : ""}`
                    : ""}
            </Label>
            {options.length === 0 ? (
                <div className="text-xs text-muted-foreground">{emptyMessage}</div>
            ) : (
                <Popover open={open} onOpenChange={onOpenChange}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-between font-normal">
                            {selectedLabel}
                            <ChevronDown className="h-4 w-4 opacity-60" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 p-2" align="start">
                        <div className="space-y-2">
                            <Input
                                placeholder={searchPlaceholder}
                                value={query}
                                onChange={(e) => onQueryChange(e.target.value)}
                            />
                            {allowMulti && (
                                <div className="flex items-center gap-2 rounded-md border bg-muted/40 p-1">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 px-2 text-xs"
                                        onClick={() => onChange(filtered.map((user) => user.id))}
                                    >
                                        Tout cocher
                                    </Button>
                                    <span className="h-4 w-px bg-border" aria-hidden />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 px-2 text-xs"
                                        onClick={() => onChange([])}
                                    >
                                        Tout décocher
                                    </Button>
                                </div>
                            )}
                            <div className="max-h-28 overflow-y-auto">
                                {filtered.map((user) => {
                                    const active = selectedIds.includes(user.id);
                                    return (
                                        <label
                                            key={user.id}
                                            className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted"
                                        >
                                            <Checkbox
                                                checked={active}
                                                onCheckedChange={(checked) => {
                                                    if (allowMulti) {
                                                        onChange(
                                                            checked
                                                                ? Array.from(new Set([...selectedIds, user.id]))
                                                                : selectedIds.filter((id) => id !== user.id),
                                                        );
                                                        return;
                                                    }
                                                    onChange(checked ? [user.id] : []);
                                                    onOpenChange(false);
                                                }}
                                            />
                                            <span className="text-sm">{user.label}</span>
                                        </label>
                                    );
                                })}
                                {filtered.length === 0 && (
                                    <div className="text-xs text-muted-foreground px-2 py-1.5">Aucun résultat.</div>
                                )}
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            )}
        </div>
    );
}

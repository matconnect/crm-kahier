"use client";

import { Plus, Trash } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
    label: string;
    values: string[];
    placeholder?: string;
    type?: string;
    disabled?: boolean;
    onChange: (next: string[]) => void;
};

export function MultiInput({ label, values, placeholder, type = "text", disabled, onChange }: Props) {
    const safeValues = values.length ? values : [""];

    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <div className="space-y-2">
                {safeValues.map((value, idx) => (
                    <div key={`${label}-${idx}`} className="flex items-center gap-2">
                        <Input
                            type={type}
                            placeholder={placeholder}
                            value={value}
                            onChange={(e) => {
                                const next = [...safeValues];
                                next[idx] = e.target.value;
                                onChange(next);
                            }}
                            disabled={disabled}
                        />
                        {safeValues.length > 1 && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9"
                                onClick={() => {
                                    const next = safeValues.filter((_, index) => index !== idx);
                                    onChange(next.length ? next : [""]);
                                }}
                                disabled={disabled}
                            >
                                <Trash className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                ))}
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => onChange([...safeValues, ""])}
                    disabled={disabled}
                >
                    <Plus className="h-4 w-4" />
                    Ajouter
                </Button>
            </div>
        </div>
    );
}

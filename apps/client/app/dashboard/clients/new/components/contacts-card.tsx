"use client";

import { Mail, Phone, Trash, User, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { ContactState } from "../types";

type Props = {
    contacts: ContactState[];
    pending: boolean;
    onChange: (id: string, key: keyof Omit<ContactState, "id">, value: string) => void;
    onAdd: () => void;
    onRemove: (id: string) => void;
};

export function ContactsCard({ contacts, pending, onChange, onAdd, onRemove }: Props) {
    return (
        <Card className="border-muted/60">
            <CardHeader className="space-y-1">
                <CardTitle className="text-base">Contacts</CardTitle>
                <CardDescription>Associe une ou plusieurs personnes référentes au compte.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {contacts.map((contact, idx) => (
                    <div key={contact.id} className="rounded-lg border border-dashed border-muted/80 p-4 space-y-3">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <UserRound className="h-4 w-4 text-muted-foreground" />
                                Contact #{idx + 1}
                            </div>
                            {contacts.length > 1 && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9"
                                    onClick={() => onRemove(contact.id)}
                                    disabled={pending}
                                >
                                    <Trash className="h-4 w-4" />
                                </Button>
                            )}
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor={`contact-first-${contact.id}`}>Prénom</Label>
                                <div className="relative">
                                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id={`contact-first-${contact.id}`}
                                        placeholder="Sophie"
                                        className="pl-9"
                                        value={contact.firstName}
                                        onChange={(e) => onChange(contact.id, "firstName", e.target.value)}
                                        disabled={pending}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor={`contact-last-${contact.id}`}>Nom</Label>
                                <Input
                                    id={`contact-last-${contact.id}`}
                                    placeholder="Martin"
                                    value={contact.lastName}
                                    onChange={(e) => onChange(contact.id, "lastName", e.target.value)}
                                    disabled={pending}
                                />
                            </div>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor={`contact-email-${contact.id}`}>Email</Label>
                                <div className="relative">
                                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id={`contact-email-${contact.id}`}
                                        type="email"
                                        placeholder="sophie@client.com"
                                        className="pl-9"
                                        value={contact.email}
                                        onChange={(e) => onChange(contact.id, "email", e.target.value)}
                                        disabled={pending}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor={`contact-phone-${contact.id}`}>Téléphone</Label>
                                <div className="relative">
                                    <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id={`contact-phone-${contact.id}`}
                                        placeholder="+33 7 00 00 00 00"
                                        className="pl-9"
                                        value={contact.phone}
                                        onChange={(e) => onChange(contact.id, "phone", e.target.value)}
                                        disabled={pending}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor={`contact-role-${contact.id}`}>Rôle</Label>
                            <Input
                                id={`contact-role-${contact.id}`}
                                placeholder="DAF, CEO..."
                                value={contact.role}
                                onChange={(e) => onChange(contact.id, "role", e.target.value)}
                                disabled={pending}
                            />
                        </div>
                    </div>
                ))}

                <Button type="button" variant="outline" className="gap-2" onClick={onAdd} disabled={pending}>
                    <UserRound className="h-4 w-4" />
                    Ajouter un contact
                </Button>
            </CardContent>
        </Card>
    );
}

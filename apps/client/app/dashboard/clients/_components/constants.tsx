import { Mail, Phone, ShieldCheck, Users } from "lucide-react";

export const SUMMARY = [
    { label: "Clients actifs", value: "54", icon: ShieldCheck },
    { label: "Prospects", value: "31", icon: Users },
    { label: "Contacts clés", value: "142", icon: Phone },
    { label: "Emails suivis", value: "86", icon: Mail },
];

export const FILTERS = {
    statuses: ["Client actif", "Prospect chaud", "Prospect", "À qualifier"],
    segments: ["Enterprise", "Mid-market", "SaaS", "PME"],
    locations: ["France", "Belgique", "Suisse", "Luxembourg"],
};

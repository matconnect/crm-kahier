import {
    BarChart3,
    Building2,
    FileText,
    LayoutGrid,
    ShieldCheck,
    Users,
} from "lucide-react";

import type { FeatureCardProps } from "./feature-card";

export const STACK_BADGES = ["Clients & prospects", "Projets & tâches", "Documents", "Reporting"];

export const FEATURES: FeatureCardProps[] = [
    {
        icon: <ShieldCheck className="h-5 w-5" />,
        title: "Authentification et rôles",
        desc: "Connexion sécurisée, rôles définis (Utilisateur, manager, administrateur) et permissions par module.",
    },
    {
        icon: <LayoutGrid className="h-5 w-5" />,
        title: "Interface moderne",
        desc: "UI claire, composants cohérents et navigation fluide pour votre équipe.",
    },
    {
        icon: <Users className="h-5 w-5" />,
        title: "Clients et prospects",
        desc: "Centralisez vos contacts et historisez toutes les interactions.",
    },
    {
        icon: <Building2 className="h-5 w-5" />,
        title: "Gestion de projets",
        desc: "Statuts, budget/tarif, planning, tâches, livrables et suivi.",
    },
    {
        icon: <FileText className="h-5 w-5" />,
        title: "Documents",
        desc: "Stockage, versionning léger, accès contrôlé par rôle.",
    },
    {
        icon: <BarChart3 className="h-5 w-5" />,
        title: "Reporting",
        desc: "KPIs, tableaux de bord, export PDF plus tard si besoin.",
    },
];

export const SECURITY_POINTS = [
    "Vue unifiée par client : contacts, échanges, tâches et documents.",
    "Suivi des projets : statuts, budgets, livrables et délais.",
    "Collaboration fluide : commentaires, historiques et notifications.",
];

export const ROADMAP_ITEMS = [
    "Module Clients / Prospects",
    "Module Projets",
    "Historique & activités",
    "Tableaux dynamiques, filtres, exports",
];

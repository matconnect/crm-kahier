import Link from "next/link";
import { List } from "lucide-react";

const SCOPE_ITEMS = [
    { label: "Accueil CRM", href: "/dashboard" },
    { label: "Clients", href: "/dashboard/clients" },
    { label: "Projets", href: "/dashboard/projects" },
    { label: "Finance", href: "/dashboard/finance" },
];

export function ScopeNavigationPanel() {
    return (
        <div className="border-b border-[#eaedf5] p-5 xl:border-r xl:border-b-0">
            <div className="flex items-center justify-between">
                <p className="text-lg font-bold">KAHIER Vue</p>
                <Link href="/dashboard" className="rounded-lg border border-[#e3e6f0] p-2" aria-label="Navigation principale">
                    <List className="h-4 w-4" />
                </Link>
            </div>
            <p className="mt-4 text-xs uppercase  text-[#8f93a9]">Navigation</p>
            <div className="mt-3 space-y-1 text-sm font-semibold text-[#2f3344]">
                {SCOPE_ITEMS.map((item, index) => (
                    <Link key={item.href} href={item.href} className={`block rounded-xl px-3 py-2 ${index === 0 ? "bg-[#f3f5fb]" : ""}`}>
                        {item.label}
                    </Link>
                ))}
            </div>
        </div>
    );
}

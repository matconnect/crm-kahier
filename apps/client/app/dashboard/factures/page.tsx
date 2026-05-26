import { requireBillingFeature } from "@/lib/authz";
import { FutureModulePage } from "../_components/future-module-page";

export default async function FacturesPage() {
    await requireBillingFeature("invoices_module");
    return (
        <FutureModulePage
            title="Factures"
            description="Le module factures couvrira l’émission, le statut de paiement et le rapprochement des règlements."
            activeMenu="factures"
        />
    );
}

import { requireBillingFeature } from "@/lib/authz";
import { FutureModulePage } from "../_components/future-module-page";

export default async function DevisPage() {
    await requireBillingFeature("quotes_module");
    return (
        <FutureModulePage
            title="Devis"
            activeMenu="devis"
        />
    );
}

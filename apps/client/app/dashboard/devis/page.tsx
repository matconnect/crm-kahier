import { requireBillingFeature } from "@/lib/authz";
import { FutureModulePage } from "../_components/future-module-page";

export default async function DevisPage() {
    await requireBillingFeature("quotes_module");
    return (
        <FutureModulePage
            title="Devis"
            description="Le module devis permettra de générer, valider et historiser les propositions commerciales liées aux clients et aux projets."
            activeMenu="devis"
        />
    );
}

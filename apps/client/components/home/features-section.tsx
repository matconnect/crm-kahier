import { FEATURES } from "./constants";
import { FeatureCard } from "./feature-card";

export function FeaturesSection() {
    return (
        <section id="features" className="py-14 md:py-18">
            <div className="mb-8 space-y-2">
                <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Une base CRM prête à évoluer</h2>
                <p className="text-muted-foreground">Commencez simple, puis enrichissez : modules, permissions, tableaux, documents, reporting.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                {FEATURES.map((feature) => (
                    <FeatureCard key={feature.title} {...feature} />
                ))}
            </div>
        </section>
    );
}

import { FEATURES } from "./constants";
import { FeatureCard } from "./feature-card";

export function FeaturesSection() {
  return (
    <section id="features" className="py-10 md:py-12">
      <div className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)] lg:items-end">
        <div className="space-y-2">
          <p className="text-xs uppercase  text-slate-500">Fonctionnalités</p>
          <h2 className="display-title text-2xl text-slate-950 md:text-3xl">Une base CRM prête à évoluer</h2>
          <p className="max-w-2xl text-slate-600">Modules, permissions, suivi et documents dans une interface homogène.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {FEATURES.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </div>
    </section>
  );
}

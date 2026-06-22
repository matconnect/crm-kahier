import Link from "next/link";

export const metadata = {
  title: "Mentions légales | KAHIER CRM",
  description: "Mentions légales de KAHIER CRM.",
};

export default function MentionsLegalesPage() {
  return (
    <main className="min-h-screen bg-[#dfe1ea] px-4 py-8 md:px-6 md:py-10">
      <div className="mx-auto max-w-4xl rounded-[2rem] border border-slate-200/80 bg-white p-6 md:p-8">
        <h1 className="font-black text-3xl text-slate-950">Mentions légales</h1>
        <p className="mt-4 text-sm text-slate-600">Dernière mise à jour : 26 mai 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-7 text-slate-700">
          <section>
            <h2 className="text-base font-semibold text-slate-900">1. Éditeur du site</h2>
            <p>Le site KAHIER CRM est édité par la société WBC SAS.</p>
            <p>Forme juridique : SAS.</p>
            <p>Capital social : 500,00 €.</p>
            <p>SIREN : 911 551 398.</p>
            <p>SIRET (siège) : 911 551 398 00017.</p>
            <p>RCS : 911 551 398 R.C.S. Rouen.</p>
            <p>N° TVA intracommunautaire : FR39 911551398.</p>
            <p>Siège social : 24 rue de Joyeuse, 76000 Rouen, France.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">2. Directeur de publication</h2>
            <p>Rodolphe Launay-Duval, président de WBC SAS.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">3. Hébergeur</h2>
            <p>OVH SAS, 2 rue Kellermann, 59100 Roubaix, France.</p>
            <p>RCS Lille Métropole : 424 761 419 00045.</p>
            <p>Code APE : 2620Z.</p>
            <p>N° TVA : FR 22 424 761 419.</p>
            <p>Téléphone : 1007 (France).</p>
            <p>Site web : https://www.ovhcloud.com/fr/</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">4. Propriété intellectuelle</h2>
            <p>
              L'ensemble du contenu présent sur KAHIER CRM est protégé par les règles de propriété intellectuelle.
              Toute reproduction, distribution ou exploitation sans autorisation est interdite.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">5. Contact</h2>
            <p>
              Pour toute question : <span className="font-medium">contact@kahier.com</span>.
            </p>
          </section>
        </div>

        <div className="mt-10 flex flex-wrap gap-3 text-sm">
          <Link href="/confidentialite" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-700 hover:bg-slate-50">
            Politique de confidentialité
          </Link>
          <Link href="/cgu" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-700 hover:bg-slate-50">
            CGU
          </Link>
          <Link href="/cgv" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-700 hover:bg-slate-50">
            CGV
          </Link>
          <Link href="/" className="rounded-full bg-slate-900 px-4 py-2 text-white hover:bg-slate-800">
            Retour accueil
          </Link>
        </div>
      </div>
    </main>
  );
}

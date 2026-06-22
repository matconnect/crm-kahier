import Link from "next/link";

export const metadata = {
  title: "Politique de confidentialité | KAHIER CRM",
  description: "Politique de confidentialité et protection des données personnelles.",
};

export default function ConfidentialitePage() {
  return (
    <main className="min-h-screen bg-[#dfe1ea] px-4 py-8 md:px-6 md:py-10">
      <div className="mx-auto max-w-4xl rounded-[2rem] border border-slate-200/80 bg-white p-6 md:p-8">
        <h1 className="font-black text-3xl text-slate-950">Politique de confidentialité</h1>

        <p className="mt-4 text-sm text-slate-600">Dernière mise à jour : 26 mai 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-7 text-slate-700">
          <section>
            <h2 className="text-base font-semibold text-slate-900">1. Responsable du traitement</h2>
            <p>
              Le responsable du traitement est WBC SAS (SIREN 911 551 398), 24 rue de Joyeuse, 76000 Rouen, France.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">2. Données collectées</h2>
            <p>
              Nous collectons notamment les données de compte (nom, email, mot de passe chiffré), les données
              d'utilisation de la plateforme et les donnees clients saisies par l'utilisateur dans son espace.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">3. Finalités</h2>
            <p>
              Les données sont traitées pour fournir le service CRM, gérer les comptes utilisateurs, sécuriser la
              plateforme, assurer le support et respecter les obligations légales et contractuelles.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">4. Base légale</h2>
            <p>
              Les traitements reposent principalement sur l'exécution du contrat, l'intérêt légitime (sécurité,
              amélioration du service) et, lorsque requis, le consentement de l'utilisateur.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">5. Durée de conservation</h2>
            <p>
              Les données sont conservées pendant la durée nécessaire aux finalités poursuivies, puis archivées ou
              supprimées conformément aux obligations légales applicables.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">6. Vos droits</h2>
            <p>
              Conformément au RGPD, vous disposez des droits d'accès, rectification, effacement, opposition,
              limitation et portabilité, ainsi que du droit d'introduire une réclamation auprès de la CNIL.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">7. Hébergement</h2>
            <p>
              Le service est hébergé par OVH SAS, 2 rue Kellermann, 59100 Roubaix, France (RCS Lille Métropole 424
              761 419 00045).
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">8. Contact</h2>
            <p>
              Pour toute demande relative à vos données personnelles : <span className="font-medium">contact@kahier.com</span>.
            </p>
          </section>
        </div>

        <div className="mt-10 flex flex-wrap gap-3 text-sm">
          <Link href="/mentions-legales" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-700 hover:bg-slate-50">
            Mentions légales
          </Link>
          <Link href="/cgu" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-700 hover:bg-slate-50">
            Lire les CGU
          </Link>
          <Link href="/cgv" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-700 hover:bg-slate-50">
            Lire les CGV
          </Link>
          <Link href="/" className="rounded-full bg-slate-900 px-4 py-2 text-white hover:bg-slate-800">
            Retour accueil
          </Link>
        </div>
      </div>
    </main>
  );
}

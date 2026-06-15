import Link from "next/link";

export const metadata = {
  title: "CGV | KAHIER CRM",
  description: "Conditions Générales de Vente de KAHIER CRM.",
};

export default function CgvPage() {
  return (
    <main className="min-h-screen bg-[#dfe1ea] px-4 py-8 md:px-6 md:py-10">
      <div className="mx-auto max-w-4xl rounded-[2rem] border border-slate-200/80 bg-white p-6 md:p-8">
        <h1 className="display-title text-3xl text-slate-950">Conditions Générales de Vente (CGV)</h1>
        <p className="mt-4 text-sm text-slate-600">Dernière mise à jour : 26 mai 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-7 text-slate-700">
          <section>
            <h2 className="text-base font-semibold text-slate-900">0. Identité du vendeur</h2>
            <p>
              Les offres KAHIER CRM sont commercialisées par WBC SAS, société par actions simplifiée au capital de
              500,00 €, immatriculée au RCS de Rouen sous le numéro 911 551 398 (SIRET 911 551 398 00017), dont le
              siège social est situé 24 rue de Joyeuse, 76000 Rouen, France.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">1. Objet</h2>
            <p>
              Les présentes CGV régissent les conditions de souscription et de facturation des offres KAHIER CRM.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">2. Offres et tarifs</h2>
            <p>
              Les offres, fonctionnalités et tarifs sont ceux affichés au jour de la commande. Les prix sont exprimés
              en euros, hors taxes ou toutes taxes comprises selon indication.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">3. Commande et paiement</h2>
            <p>
              La commande est définitive à validation du paiement. Les modalités de paiement (périodicité, moyens,
              échéances) sont précisées au moment de la souscription.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">4. Durée et résiliation</h2>
            <p>
              Sauf mention contraire, les abonnements sont conclus pour la durée choisie puis renouvelés selon les
              conditions contractuelles, avec possibilité de résiliation conformément aux délais applicables.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">5. Service client</h2>
            <p>
              Pour toute question commerciale ou de facturation, l'utilisateur peut contacter le support via les
              canaux mis à disposition dans son espace.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">6. Limitation de responsabilité</h2>
            <p>
              La responsabilité de KAHIER CRM est limitée aux dommages directs prouvés dans la limite des sommes payées
              sur la période de référence, sauf disposition légale contraire.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">7. Droit applicable</h2>
            <p>
              Les présentes CGV sont soumises au droit français. En cas de litige, compétence est attribuée aux
              juridictions compétentes du ressort de la Cour d'appel de Rouen, sauf disposition légale impérative contraire.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">8. Contact</h2>
            <p>Contact : contact@kahier.com</p>
          </section>
        </div>

        <div className="mt-10 flex flex-wrap gap-3 text-sm">
          <Link href="/confidentialite" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-700 hover:bg-slate-50">
            Politique de confidentialité
          </Link>
          <Link href="/mentions-legales" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-700 hover:bg-slate-50">
            Mentions légales
          </Link>
          <Link href="/cgu" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-700 hover:bg-slate-50">
            Lire les CGU
          </Link>
          <Link href="/" className="rounded-full bg-slate-900 px-4 py-2 text-white hover:bg-slate-800">
            Retour accueil
          </Link>
        </div>
      </div>
    </main>
  );
}

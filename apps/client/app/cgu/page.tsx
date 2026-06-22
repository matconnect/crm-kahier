import Link from "next/link";

export const metadata = {
  title: "CGU | KAHIER CRM",
  description: "Conditions Générales d'Utilisation de KAHIER CRM.",
};

export default function CguPage() {
  return (
    <main className="min-h-screen bg-[#dfe1ea] px-4 py-8 md:px-6 md:py-10">
      <div className="mx-auto max-w-4xl rounded-[2rem] border border-slate-200/80 bg-white p-6 md:p-8">
        <h1 className="font-black text-3xl text-slate-950">Conditions Générales d'Utilisation (CGU)</h1>
        <p className="mt-4 text-sm text-slate-600">Dernière mise à jour : 26 mai 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-7 text-slate-700">
          <section>
            <h2 className="text-base font-semibold text-slate-900">0. Identité de l'éditeur</h2>
            <p>
              Le service KAHIER CRM est édité par WBC SAS, société par actions simplifiée au capital de 500,00 €,
              immatriculée au RCS de Rouen sous le numéro 911 551 398 (SIRET 911 551 398 00017), dont le siège social
              est situé 24 rue de Joyeuse, 76000 Rouen, France.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">1. Objet</h2>
            <p>
              Les présentes CGU définissent les conditions d'accès et d'utilisation de la plateforme KAHIER CRM.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">2. Accès au service</h2>
            <p>
              L'utilisateur crée un compte et s'engage à fournir des informations exactes. Il est responsable de la
              confidentialité de ses identifiants.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">3. Engagements utilisateur</h2>
            <p>
              L'utilisateur s'interdit tout usage illicite, toute tentative d'accès non autorisé et toute action
              susceptible d'altérer le fonctionnement de la plateforme.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">4. Disponibilité</h2>
            <p>
              KAHIER CRM met en oeuvre les moyens raisonnables pour assurer la disponibilité du service, sans
              obligation de résultat ni garantie d'absence d'interruption.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">5. Propriété intellectuelle</h2>
            <p>
              L'ensemble des éléments logiciels, graphiques et textuels de la plateforme est protégé. Toute
              reproduction non autorisée est interdite.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">6. Responsabilité</h2>
            <p>
              KAHIER CRM ne pourra être tenue responsable des dommages indirects ou des pertes d'exploitation liés à
              l'usage du service, dans les limites prévues par la loi.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">7. Droit applicable</h2>
            <p>
              Les présentes CGU sont soumises au droit français. En cas de litige, compétence est attribuée aux
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

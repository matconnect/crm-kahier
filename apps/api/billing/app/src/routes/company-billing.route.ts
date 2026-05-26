import { Router, type Router as ExpressRouter } from "express";
import { prisma, Role } from "@kahier/db-company";
import { getStripe, requirePublicAppUrl, resolveStripePriceId } from "../services/stripe.service.js";

const router: ExpressRouter = Router();

router.use(async (req, res, next) => {
  const userId = (req.headers["x-user-id"] as string | undefined)?.trim();
  if (!userId) return res.status(401).json({ error: "x-user-id requis" });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.companyId) return res.status(401).json({ error: "Utilisateur ou entreprise introuvable" });

  (req as unknown as { currentUser: typeof user }).currentUser = user;
  next();
});

router.post("/portal-session", async (req, res) => {
  const currentUser = (req as unknown as { currentUser: { companyId: string; role: Role } }).currentUser;
  if (currentUser.role !== "ADMIN") return res.status(403).json({ error: "Accès refusé" });

  const stripe = getStripe();
  if (!stripe) return res.status(500).json({ error: "Stripe non configuré." });

  const company = await prisma.company.findUnique({
    where: { id: currentUser.companyId },
    select: { stripeCustomerId: true },
  });
  if (!company?.stripeCustomerId) {
    return res.status(400).json({ error: "Aucun client Stripe lié pour cette entreprise." });
  }

  const appBaseUrl = requirePublicAppUrl();
  if (!appBaseUrl) return res.status(500).json({ error: "URL publique de l'application introuvable." });

  const session = await stripe.billingPortal.sessions.create({
    customer: company.stripeCustomerId,
    return_url: `${appBaseUrl}/dashboard/settings`,
  });

  if (!session.url) return res.status(500).json({ error: "Impossible de créer l'accès au portail Stripe." });
  return res.json({ url: session.url });
});

router.post("/upgrade-session", async (req, res) => {
  try {
    const currentUser = (req as unknown as { currentUser: { id: string; companyId: string; role: Role; email: string } })
      .currentUser;
    if (currentUser.role !== "ADMIN") return res.status(403).json({ error: "Accès refusé" });

    const stripe = getStripe();
    if (!stripe) return res.status(500).json({ error: "Stripe non configuré." });

    const body = (req.body ?? {}) as { planId?: string; billingCycle?: string };
    const planId = body.planId === "enterprise" ? "enterprise" : body.planId === "pro" ? "pro" : null;
    const billingCycle = body.billingCycle === "yearly" ? "yearly" : "monthly";
    if (!planId) {
      return res.status(400).json({ error: "Plan invalide. Utilisez `pro` ou `enterprise`." });
    }

    const company = await prisma.company.findUnique({
      where: { id: currentUser.companyId },
      select: { id: true, subscriptionType: true, stripeCustomerId: true },
    });
    if (!company) return res.status(404).json({ error: "Entreprise introuvable." });

    if (company.subscriptionType !== "STARTER_FREE") {
      return res.status(400).json({ error: "Votre entreprise dispose déjà d'un abonnement payant. Utilisez le portail d'abonnement." });
    }

    const priceId = resolveStripePriceId(planId, billingCycle);
    if (!priceId) {
      return res.status(400).json({ error: "Prix Stripe introuvable pour ce plan." });
    }

    const appBaseUrl = requirePublicAppUrl();
    if (!appBaseUrl) return res.status(500).json({ error: "URL publique de l'application introuvable." });

    const stripePrice = await stripe.prices.retrieve(priceId);
    if (!stripePrice?.recurring) {
      return res.status(400).json({
        error: "Le prix Stripe configuré n'est pas récurrent. Configurez un price d'abonnement (mensuel/annuel) pour ce plan.",
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer: company.stripeCustomerId ?? undefined,
      customer_email: company.stripeCustomerId ? undefined : currentUser.email,
      client_reference_id: company.id,
      success_url: `${appBaseUrl}/dashboard/settings?upgrade=success`,
      cancel_url: `${appBaseUrl}/dashboard/settings?upgrade=cancelled`,
      metadata: {
        source: "crm-upgrade",
        planId,
        billingCycle,
        billingKind: "subscription",
        companyId: company.id,
        userId: currentUser.id,
        previousSubscriptionType: company.subscriptionType,
      },
    });

    if (!session.url) return res.status(500).json({ error: "Impossible de créer le lien de paiement Stripe." });
    return res.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur Stripe inconnue.";
    if (message.includes("at least one recurring price")) {
      return res.status(400).json({
        error: "Le prix Stripe sélectionné n'est pas récurrent. Vérifiez les variables STRIPE_PRICE_PRO / STRIPE_PRICE_PRO_YEARLY.",
      });
    }
    return res.status(500).json({ error: `Erreur upgrade Stripe: ${message}` });
  }
});

export default router;

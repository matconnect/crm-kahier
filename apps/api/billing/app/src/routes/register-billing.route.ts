import { Router, type Router as ExpressRouter } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "@kahier/db-company";
import { generateCompanyCode, resolveSubscriptionType, slugify } from "../lib/company.js";
import { fromUnix, getStripe, requirePublicAppUrl, resolveStripePriceId } from "../services/stripe.service.js";

const router: ExpressRouter = Router();

router.post("/register-with-plan", async (req, res) => {
  try {
    const body = req.body as {
      email?: string;
      password?: string;
      firstName?: string;
      lastName?: string;
      companyName?: string;
      planId?: string;
      billingCycle?: string;
      returnBaseUrl?: string;
    };

    const email = body.email?.trim().toLowerCase();
    const password = body.password;
    const firstName = body.firstName?.trim() || null;
    const lastName = body.lastName?.trim() || null;
    const companyName = body.companyName?.trim() || null;
    const planId = body.planId?.trim().toLowerCase() || null;
    const billingCycle = body.billingCycle === "yearly" ? "yearly" : "monthly";
    if (!email || !password || !firstName || !lastName || !companyName || !planId) {
      return res.status(400).json({ error: "Email, prénom, nom, mot de passe, entreprise et abonnement requis." });
    }

    const stripe = getStripe();
    if (!stripe) {
      return res.status(500).json({ error: "Stripe non configuré (STRIPE_SECRET_KEY manquant)." });
    }

    const priceId = resolveStripePriceId(planId, billingCycle);
    if (!priceId) {
      return res.status(400).json({ error: "Abonnement invalide ou non configuré côté Stripe." });
    }

    const appBaseUrl = body.returnBaseUrl?.trim() || requirePublicAppUrl();
    if (!appBaseUrl) {
      return res.status(500).json({ error: "URL publique de l'application introuvable." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Email invalide. Essayez une autre adresse (exemple@gmail.com)." });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "Mot de passe trop court (8 minimum)." });
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return res.status(409).json({ error: "Email déjà utilisé." });
    }

    const hash = await bcrypt.hash(password, 10);
    const slug = slugify(companyName);

    const created = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: companyName,
          id: `cmp_${slug}_${Date.now()}`,
          code: generateCompanyCode(),
          subscriptionType: resolveSubscriptionType(planId, billingCycle),
        },
      });

      const user = await tx.user.create({
        data: { email, password: hash, firstName, lastName, role: "ADMIN", companyId: company.id },
        select: { id: true, email: true, firstName: true, lastName: true, role: true, companyId: true, createdAt: true },
      });

      return { company, user };
    });

    const starterOneShot = planId === "starter";
    const session = await stripe.checkout.sessions.create(
      starterOneShot
        ? {
            mode: "payment",
            line_items: [{ price: priceId, quantity: 1 }],
            customer_email: email,
            client_reference_id: created.company.id,
            success_url: `${appBaseUrl}/login?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${appBaseUrl}/register?checkout=cancelled`,
            metadata: {
              source: "crm-register",
              planId,
              billingCycle,
              billingKind: "one-shot",
              companyId: created.company.id,
              userId: created.user.id,
            },
          }
        : {
            mode: "subscription",
            line_items: [{ price: priceId, quantity: 1 }],
            customer_email: email,
            client_reference_id: created.company.id,
            success_url: `${appBaseUrl}/login?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${appBaseUrl}/register?checkout=cancelled`,
            metadata: {
              source: "crm-register",
              planId,
              billingCycle,
              billingKind: "subscription",
              companyId: created.company.id,
              userId: created.user.id,
            },
          },
    );

    if (!session.url) {
      return res.status(500).json({ error: "Impossible de créer le lien de paiement Stripe." });
    }

    return res.status(201).json({
      checkoutUrl: session.url,
      requiresCheckout: true,
      user: created.user,
      company: {
        id: created.company.id,
        name: created.company.name,
        code: created.company.code,
        subscriptionType: created.company.subscriptionType,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue Stripe.";
    if (message.includes("at least one recurring price")) {
      return res.status(400).json({
        error: "Le prix Stripe sélectionné n'est pas récurrent. Vérifie que ce `price_...` est bien en abonnement mensuel/annuel.",
      });
    }
    if (message.includes("You must provide at least one line item")) {
      return res.status(400).json({ error: "Le price Stripe sélectionné est invalide ou introuvable." });
    }
    return res.status(500).json({ error: `Erreur Stripe: ${message}` });
  }
});

router.get("/checkout-session-status", async (req, res) => {
  try {
    const sessionId = typeof req.query.sessionId === "string" ? req.query.sessionId.trim() : "";
    if (!sessionId) {
      return res.status(400).json({ error: "sessionId manquant." });
    }

    const stripe = getStripe();
    if (!stripe) {
      return res.status(500).json({ error: "Stripe non configuré (STRIPE_SECRET_KEY manquant)." });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const planId = session.metadata?.planId?.trim().toLowerCase() ?? null;
    const billingCycle = session.metadata?.billingCycle?.trim().toLowerCase() ?? null;
    const paid = session.payment_status === "paid" || session.status === "complete";
    const companyId = session.metadata?.companyId?.trim() || session.client_reference_id?.trim() || "";

    if (paid && companyId) {
      const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;
      const subscriptionId =
        typeof session.subscription === "string" ? session.subscription : session.subscription?.id ?? null;

      let stripePriceId: string | null = null;
      let currentPeriodStart: Date | null = null;
      let currentPeriodEnd: Date | null = null;
      let stripeSubscriptionStatus: string | null = null;

      if (subscriptionId) {
        const sub = (await stripe.subscriptions.retrieve(subscriptionId)) as any;
        stripePriceId = sub?.items?.data?.[0]?.price?.id ?? null;
        currentPeriodStart = fromUnix(sub?.items?.data?.[0]?.current_period_start ?? sub?.current_period_start ?? null);
        currentPeriodEnd = fromUnix(sub?.items?.data?.[0]?.current_period_end ?? sub?.current_period_end ?? null);
        stripeSubscriptionStatus = sub?.status ?? null;
      }

      await prisma.company.update({
        where: { id: companyId },
        data: {
          subscriptionType: resolveSubscriptionType(planId, billingCycle),
          stripeCustomerId: customerId ?? undefined,
          stripeSubscriptionId: subscriptionId ?? undefined,
          stripePriceId: stripePriceId ?? undefined,
          stripeSubscriptionStatus:
            stripeSubscriptionStatus ?? (session.payment_status === "paid" ? "paid" : session.payment_status),
          stripePurchasedAt: fromUnix(session.created) ?? new Date(),
          stripeCurrentPeriodStart: currentPeriodStart ?? undefined,
          stripeCurrentPeriodEnd: currentPeriodEnd ?? undefined,
        },
      });
    }

    return res.json({
      ok: true,
      paid,
      status: session.status ?? null,
      paymentStatus: session.payment_status ?? null,
      email: session.customer_details?.email ?? session.customer_email ?? null,
      planId,
      billingCycle,
      companyId: companyId || null,
      userId: session.metadata?.userId ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue Stripe.";
    return res.status(500).json({ error: `Erreur Stripe: ${message}` });
  }
});

export default router;

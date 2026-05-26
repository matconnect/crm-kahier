import { Router, type Router as ExpressRouter, type Request, type Response } from "express";
import Stripe from "stripe";
import { prisma } from "@kahier/db-company";
import { resolveSubscriptionType } from "../lib/company.js";
import { fromUnix, getStripe, getStripeWebhookSecret } from "../services/stripe.service.js";

const router: ExpressRouter = Router();

router.post("/", async (req: Request, res: Response) => {
  const stripe = getStripe();
  const webhookSecret = getStripeWebhookSecret();
  if (!stripe || !webhookSecret) {
    return res.status(500).send("stripe_not_configured");
  }

  const signature = req.headers["stripe-signature"];
  if (!signature || typeof signature !== "string") {
    return res.status(400).send("missing_signature");
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body as Buffer, signature, webhookSecret);
  } catch {
    return res.status(400).send("invalid_signature");
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const companyId = session.metadata?.companyId?.trim() || session.client_reference_id?.trim() || "";
      if (companyId) {
        const planId = session.metadata?.planId?.trim().toLowerCase() || null;
        const billingCycle = session.metadata?.billingCycle?.trim().toLowerCase() || null;
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
            stripeSubscriptionStatus: stripeSubscriptionStatus ?? (session.payment_status === "paid" ? "paid" : session.payment_status),
            stripePurchasedAt: fromUnix(session.created) ?? new Date(),
            stripeCurrentPeriodStart: currentPeriodStart ?? undefined,
            stripeCurrentPeriodEnd: currentPeriodEnd ?? undefined,
          },
        });
      }
    }

    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const sub = event.data.object as any;
      const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? null;
      if (customerId) {
        await prisma.company.updateMany({
          where: { stripeCustomerId: customerId },
          data: {
            stripeSubscriptionId: sub.id,
            stripePriceId: sub?.items?.data?.[0]?.price?.id ?? undefined,
            stripeSubscriptionStatus: sub?.status ?? undefined,
            stripeCurrentPeriodStart: fromUnix(sub?.items?.data?.[0]?.current_period_start ?? sub?.current_period_start ?? null) ?? undefined,
            stripeCurrentPeriodEnd: fromUnix(sub?.items?.data?.[0]?.current_period_end ?? sub?.current_period_end ?? null) ?? undefined,
          },
        });
      }
    }

    if (event.type === "customer.created" || event.type === "customer.updated") {
      const customer = event.data.object as any;
      const customerId = typeof customer?.id === "string" ? customer.id : null;
      const email = typeof customer?.email === "string" ? customer.email.trim().toLowerCase() : null;
      if (customerId && email) {
        const linkedUser = await prisma.user.findUnique({
          where: { email },
          select: { companyId: true },
        });
        if (linkedUser?.companyId) {
          await prisma.company.update({
            where: { id: linkedUser.companyId },
            data: { stripeCustomerId: customerId },
          });
        }
      }
    }

    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as any;
      const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id ?? null;
      const subscriptionId = typeof invoice?.subscription === "string" ? invoice.subscription : invoice?.subscription?.id ?? null;

      if (customerId) {
        const result = await prisma.company.updateMany({
          where: { stripeCustomerId: customerId },
          data: {
            stripeSubscriptionId: subscriptionId ?? undefined,
            stripeSubscriptionStatus: "active",
            stripePurchasedAt: new Date(),
          },
        });
        if (result.count === 0 && subscriptionId) {
          await prisma.company.updateMany({
            where: { stripeSubscriptionId: subscriptionId },
            data: {
              stripeSubscriptionStatus: "active",
              stripePurchasedAt: new Date(),
            },
          });
        }
      }
    }

    return res.json({ received: true });
  } catch {
    return res.status(500).send("webhook_processing_failed");
  }
});

export default router;

import Stripe from "stripe";
import { getEnvOrFile, resolvePublicAppUrl } from "../lib/env.js";

export type PaidPlanId = "pro" | "enterprise";
export type BillingCycle = "monthly" | "yearly";

export function getStripe() {
  const stripeSecretKey = getEnvOrFile("STRIPE_SECRET_KEY");
  if (!stripeSecretKey) return null;
  return new Stripe(stripeSecretKey);
}

export function getStripeWebhookSecret() {
  return getEnvOrFile("STRIPE_WEBHOOK_SECRET");
}

export function resolveStripePriceId(planId: string, billingCycle: BillingCycle): string | null {
  const monthlyMap: Record<string, string | undefined> = {
    starter: getEnvOrFile("STRIPE_PRICE_STARTER") ?? undefined,
    pro: getEnvOrFile("STRIPE_PRICE_PRO") ?? undefined,
    enterprise: getEnvOrFile("STRIPE_PRICE_ENTERPRISE") ?? undefined,
  };
  const yearlyMap: Record<string, string | undefined> = {
    starter: getEnvOrFile("STRIPE_PRICE_STARTER_YEARLY") ?? undefined,
    pro: getEnvOrFile("STRIPE_PRICE_PRO_YEARLY") ?? undefined,
    enterprise: getEnvOrFile("STRIPE_PRICE_ENTERPRISE_YEARLY") ?? undefined,
  };
  const map = billingCycle === "yearly" ? yearlyMap : monthlyMap;
  return map[planId]?.trim() ?? null;
}

export function requirePublicAppUrl() {
  return resolvePublicAppUrl();
}

export function fromUnix(seconds?: number | null): Date | null {
  if (!seconds || !Number.isFinite(seconds)) return null;
  return new Date(seconds * 1000);
}

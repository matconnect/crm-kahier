export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function generateCompanyCode() {
  return `cmp_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export function resolveSubscriptionType(planId?: string | null, billingCycle?: string | null): string {
  if (planId === "starter") return "STARTER_FREE";
  if (planId === "pro") return billingCycle === "yearly" ? "PRO_YEARLY" : "PRO_MONTHLY";
  if (planId === "enterprise") return billingCycle === "yearly" ? "ENTERPRISE_YEARLY" : "ENTERPRISE_MONTHLY";
  return "STARTER_FREE";
}

export type SubscriptionType =
    | "STARTER_FREE"
    | "PRO_MONTHLY"
    | "PRO_YEARLY"
    | "ENTERPRISE_MONTHLY"
    | "ENTERPRISE_YEARLY";

export type BillingFeature = "finance_dashboard" | "quotes_module" | "invoices_module";

const FEATURE_MATRIX: Record<SubscriptionType, BillingFeature[]> = {
    STARTER_FREE: [],
    PRO_MONTHLY: ["finance_dashboard", "quotes_module", "invoices_module"],
    PRO_YEARLY: ["finance_dashboard", "quotes_module", "invoices_module"],
    ENTERPRISE_MONTHLY: ["finance_dashboard", "quotes_module", "invoices_module"],
    ENTERPRISE_YEARLY: ["finance_dashboard", "quotes_module", "invoices_module"],
};

export function normalizeSubscriptionType(value: string | null | undefined): SubscriptionType {
    if (!value) return "STARTER_FREE";
    if (value in FEATURE_MATRIX) return value as SubscriptionType;
    return "STARTER_FREE";
}

export function hasBillingFeature(subscriptionType: string | null | undefined, feature: BillingFeature): boolean {
    const normalized = normalizeSubscriptionType(subscriptionType);
    return FEATURE_MATRIX[normalized].includes(feature);
}

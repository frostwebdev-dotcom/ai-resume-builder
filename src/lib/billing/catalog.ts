/**
 * Launch catalog + future upsell placeholders.
 * Amounts are in minor units (cents). Swap to Stripe Price IDs later without changing SKUs.
 */
export type BillingProductSku =
  | "resume_pdf_v1"
  | "resume_cover_letter_v1"
  | "tailored_job_pack_v1";

export type BillingProductDefinition = {
  sku: BillingProductSku;
  /** User-facing name */
  label: string;
  /** Short description for Checkout / pricing */
  description: string;
  amountCents: number;
  currency: "usd";
  /** When false, checkout creation is rejected (placeholder upsell). */
  availableAtCheckout: boolean;
  /** Stripe Dashboard product grouping (metadata) */
  category: "resume_export" | "bundle" | "tailoring";
};

export const BILLING_PRODUCTS: Record<BillingProductSku, BillingProductDefinition> = {
  resume_pdf_v1: {
    sku: "resume_pdf_v1",
    label: "Resume PDF export",
    description: "One-time export of your resume as a print-ready PDF.",
    amountCents: 999,
    currency: "usd",
    availableAtCheckout: true,
    category: "resume_export",
  },
  resume_cover_letter_v1: {
    sku: "resume_cover_letter_v1",
    label: "Resume + cover letter",
    description: "Matched cover letter PDF — coming soon.",
    amountCents: 1499,
    currency: "usd",
    availableAtCheckout: false,
    category: "bundle",
  },
  tailored_job_pack_v1: {
    sku: "tailored_job_pack_v1",
    label: "Tailored job pack",
    description: "Job-specific tailoring passes — coming soon.",
    amountCents: 1999,
    currency: "usd",
    availableAtCheckout: false,
    category: "tailoring",
  },
};

export function getBillingProduct(sku: string): BillingProductDefinition | null {
  if (sku in BILLING_PRODUCTS) {
    return BILLING_PRODUCTS[sku as BillingProductSku];
  }
  return null;
}

export function assertCheckoutableProduct(sku: string): BillingProductDefinition {
  const p = getBillingProduct(sku);
  if (!p) {
    throw new Error("Unknown product.");
  }
  if (!p.availableAtCheckout) {
    throw new Error("This product is not available yet.");
  }
  return p;
}

/**
 * Single source of truth for money-related user copy (ties to {@link BILLING_PRODUCTS}).
 * Use these strings on marketing, guest /create, checkout, and FAQ so pricing never drifts.
 */
import { BILLING_PRODUCTS } from "@/lib/billing/catalog";
import { formatUsdFromCents } from "@/lib/billing/format-money";

export const RESUME_PDF_EXPORT_PRICE_USD = formatUsdFromCents(
  BILLING_PRODUCTS.resume_pdf_v1.amountCents,
);

/** One line — use in banners, footers, and FAQ. */
export const PAY_ONCE_PDF_PER_PROJECT_LINE = `Preview and editing are free. PDF export is ${RESUME_PDF_EXPORT_PRICE_USD} once per resume project at checkout (no subscription at launch).`;

/** Clarifies entitlement scope after purchase. */
export const PDF_UNLOCK_PROJECT_SCOPE_LINE =
  "The PDF unlock applies to that resume project only—including new downloads when you change the content.";

/** Marketing pricing page — hero subline (business model). */
export const PRICING_HERO_TAGLINE = "Start free. Pay only when you are ready to download.";

/**
 * Roadmap offers shown on the pricing page only — not sold in checkout until
 * {@link BILLING_PRODUCTS}[sku].`availableAtCheckout` is true. Copy stays aligned with catalog labels.
 */
export const PRICING_COMING_SOON_OFFERS = [
  {
    sku: "resume_cover_letter_v1" as const,
    headline: BILLING_PRODUCTS.resume_cover_letter_v1.label,
    teaser:
      "Planned add-on: a cover letter that matches your resume and tone. Not available for purchase yet.",
  },
  {
    sku: "tailored_job_pack_v1" as const,
    headline: BILLING_PRODUCTS.tailored_job_pack_v1.label,
    teaser:
      "Planned add-on: deeper tailoring for a specific role or posting. Not available for purchase yet.",
  },
] as const;

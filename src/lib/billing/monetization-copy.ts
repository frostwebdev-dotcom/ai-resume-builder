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

import { z } from "zod";

import type { BillingProductSku } from "@/lib/billing/catalog";

const skuSchema = z.enum([
  "resume_pdf_v1",
  "resume_cover_letter_v1",
  "tailored_job_pack_v1",
] satisfies [BillingProductSku, ...BillingProductSku[]]);

export const createCheckoutSessionSchema = z.object({
  projectId: z.string().uuid(),
  productSku: skuSchema,
});

export const pollCheckoutOrderSchema = z.object({
  projectId: z.string().uuid(),
  checkoutSessionId: z.string().min(8, "Invalid session."),
});

import { z } from "zod";

import { emailSchema } from "@/validation/common";

export const contactTopicSchema = z.enum(["product", "billing", "partnership", "other"]);

export type ContactTopic = z.infer<typeof contactTopicSchema>;

export const CONTACT_TOPIC_LABELS: Record<ContactTopic, string> = {
  product: "Product questions",
  billing: "Billing & refunds",
  partnership: "Partnerships & press",
  other: "Other",
};

export const contactFormSchema = z.object({
  name: z.string().trim().max(120).optional(),
  email: emailSchema,
  topic: contactTopicSchema,
  message: z
    .string()
    .trim()
    .min(20, "Please write at least a few sentences so we can help.")
    .max(5000, "Message is too long (max 5,000 characters)."),
  /** Honeypot — must stay empty (bots fill hidden fields). */
  company: z.string().max(100).optional(),
});

export type ContactFormInput = z.infer<typeof contactFormSchema>;

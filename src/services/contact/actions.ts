"use server";

import { headers } from "next/headers";

import { enforceContactFormLimit } from "@/lib/security/rate-limit-enforcement";
import { sendContactFormTransactionalEmails } from "@/services/email/contact-form";
import { contactFormSchema } from "@/validation/contact";

export type SubmitContactFormState =
  | { ok: true; message: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export async function submitContactFormAction(raw: unknown): Promise<SubmitContactFormState> {
  const parsed = contactFormSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors as Record<string, string[]>;
    return {
      ok: false,
      error: "Please check the highlighted fields and try again.",
      fieldErrors,
    };
  }

  if (parsed.data.company?.trim()) {
    return { ok: true, message: "Thanks — we will get back to you shortly." };
  }

  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip")?.trim() ||
    "unknown";

  const rl = await enforceContactFormLimit(`ip:${ip}`);
  if (!rl.ok) {
    return { ok: false, error: rl.message };
  }

  await sendContactFormTransactionalEmails({
    visitorEmail: parsed.data.email,
    name: parsed.data.name?.trim() || null,
    topic: parsed.data.topic,
    message: parsed.data.message,
  });

  return {
    ok: true,
    message:
      "Thanks — we received your message. You should get a confirmation email at the address you entered shortly.",
  };
}

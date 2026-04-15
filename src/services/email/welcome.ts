import "server-only";

import { appAbsoluteUrl } from "@/lib/email/app-origin";
import { sendTransactionalEmail } from "@/lib/email/send";
import { buildWelcomeEmail, welcomeEmailSubject } from "@/lib/email/templates/welcome";
import { ROUTES } from "@/lib/constants";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import type { Json } from "@/types/database";

/**
 * Sends welcome email once per account (tracked in `profiles.preferences`).
 * Safe to call from signup and OAuth/email-confirm callback; failures are logged only.
 */
export async function trySendWelcomeEmail(userId: string, email: string): Promise<void> {
  const service = createSupabaseServiceRoleClient();

  const { data: profile, error } = await service
    .from("profiles")
    .select("preferences")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("[email] welcome: profile read", error);
    return;
  }

  const raw = profile?.preferences;
  const prefs =
    raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  if (typeof prefs.welcome_email_sent_at === "string") {
    return;
  }

  const dashboardUrl = appAbsoluteUrl(ROUTES.app.root);
  const { html, text } = buildWelcomeEmail({ dashboardUrl });

  const result = await sendTransactionalEmail({
    to: email,
    subject: welcomeEmailSubject(),
    html,
    text,
    tags: [{ name: "category", value: "welcome" }],
  });

  if (result.ok === false) {
    if ("skipped" in result && result.reason === "not_configured") {
      return;
    }
    return;
  }

  const nextPrefs = {
    ...prefs,
    welcome_email_sent_at: new Date().toISOString(),
  } as unknown as Json;

  const { error: upErr } = await service.from("profiles").update({ preferences: nextPrefs }).eq("id", userId);
  if (upErr) {
    console.error("[email] welcome: could not persist preferences flag", upErr);
  }
}

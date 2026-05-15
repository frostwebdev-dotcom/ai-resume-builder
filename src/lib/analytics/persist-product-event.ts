import "server-only";

import type { Json } from "@/types/database";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * Writes one allowlisted product analytics row (same-origin ingest + server funnels).
 * Never pass resume text, names, or raw emails in `props`.
 */
export async function persistProductAnalyticsEvent(
  event: string,
  props?: Record<string, unknown>,
  client_ts?: number | null,
): Promise<void> {
  try {
    const service = createSupabaseServiceRoleClient();
    const { error } = await service.from("product_analytics_events").insert({
      event,
      props: (props ?? {}) as Json,
      client_ts: client_ts ?? null,
    });
    if (error) {
      console.error("[analytics] persist", event, error.message);
    }
  } catch (e) {
    console.error("[analytics] persist", event, e);
  }
}

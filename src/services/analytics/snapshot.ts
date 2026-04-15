import "server-only";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

export type RollingFunnelSnapshot = {
  windowDays: number;
  projectsCreated: number;
  ordersCompleted: number;
  aiGenerationsSucceeded: number;
  pdfDownloads: number;
};

/**
 * Database-backed rolling counts for internal reporting (complements structured analytics logs).
 */
export async function getRollingFunnelSnapshot(days = 7): Promise<RollingFunnelSnapshot> {
  const service = createSupabaseServiceRoleClient();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const [projects, orders, ai, downloads] = await Promise.all([
    service
      .from("resume_projects")
      .select("*", { count: "exact", head: true })
      .is("deleted_at", null)
      .gte("created_at", since),
    service
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed")
      .gte("created_at", since),
    service
      .from("ai_generation_logs")
      .select("*", { count: "exact", head: true })
      .eq("ok", true)
      .gte("created_at", since),
    service.from("downloads").select("*", { count: "exact", head: true }).gte("created_at", since),
  ]);

  return {
    windowDays: days,
    projectsCreated: projects.count ?? 0,
    ordersCompleted: orders.count ?? 0,
    aiGenerationsSucceeded: ai.count ?? 0,
    pdfDownloads: downloads.count ?? 0,
  };
}

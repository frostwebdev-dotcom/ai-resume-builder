import "server-only";

import { clientEnv } from "@/lib/env";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

export type AdminOverviewMetrics = {
  userCount: number;
  projectCount: number;
  orderCount: number;
  completedOrderCount: number;
  paymentTotalCents: number;
  downloadCount: number;
  aiLogCount: number;
  aiFailureCount24h: number;
  auditLogCount: number;
};

export async function getAdminOverviewMetrics(): Promise<AdminOverviewMetrics> {
  const service = createSupabaseServiceRoleClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [
    users,
    projects,
    orders,
    completedOrders,
    downloads,
    aiLogs,
    aiFails,
    audits,
    payments,
  ] = await Promise.all([
    service.from("profiles").select("*", { count: "exact", head: true }),
    service.from("resume_projects").select("*", { count: "exact", head: true }).is("deleted_at", null),
    service.from("orders").select("*", { count: "exact", head: true }),
    service.from("orders").select("*", { count: "exact", head: true }).eq("status", "completed"),
    service.from("downloads").select("*", { count: "exact", head: true }),
    service.from("ai_generation_logs").select("*", { count: "exact", head: true }),
    service
      .from("ai_generation_logs")
      .select("*", { count: "exact", head: true })
      .eq("ok", false)
      .gte("created_at", since),
    service.from("admin_audit_logs").select("*", { count: "exact", head: true }),
    service.from("payments").select("amount_cents").eq("status", "paid").limit(50_000),
  ]);

  const paymentRows = payments.data ?? [];
  const paymentTotalCents = paymentRows.reduce((sum, row) => sum + (row.amount_cents ?? 0), 0);

  return {
    userCount: users.count ?? 0,
    projectCount: projects.count ?? 0,
    orderCount: orders.count ?? 0,
    completedOrderCount: completedOrders.count ?? 0,
    paymentTotalCents,
    downloadCount: downloads.count ?? 0,
    aiLogCount: aiLogs.count ?? 0,
    aiFailureCount24h: aiFails.count ?? 0,
    auditLogCount: audits.count ?? 0,
  };
}

export async function getAdminHealthProbe(): Promise<{ ok: boolean; latencyMs: number }> {
  const base = clientEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const start = Date.now();
  try {
    const res = await fetch(`${base}/api/health`, { cache: "no-store" });
    return { ok: res.ok, latencyMs: Date.now() - start };
  } catch {
    return { ok: false, latencyMs: Date.now() - start };
  }
}

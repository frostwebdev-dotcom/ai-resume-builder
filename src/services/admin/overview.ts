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

async function sumPaidCentsAllTime(): Promise<number> {
  const service = createSupabaseServiceRoleClient();
  const to = new Date().toISOString();
  const { data, error } = await service.rpc("admin_sum_paid_cents_between", {
    p_from: "1970-01-01T00:00:00.000Z",
    p_to: to,
  });
  if (error) {
    console.warn("[admin] sum paid rpc fallback", error.message);
    const { data: rows } = await service.from("payments").select("amount_cents").eq("status", "paid").limit(100_000);
    return (rows ?? []).reduce((s, r) => s + (r.amount_cents ?? 0), 0);
  }
  if (typeof data === "number") return data;
  if (typeof data === "string") return Number.parseInt(data, 10) || 0;
  return 0;
}

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
    paymentTotalCents,
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
    sumPaidCentsAllTime(),
  ]);

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

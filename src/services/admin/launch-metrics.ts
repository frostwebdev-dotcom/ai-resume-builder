import "server-only";

import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

export type AdminLaunchRangeKey = "7d" | "30d" | "90d" | "all";

export function parseAdminLaunchRange(raw: string | string[] | undefined): AdminLaunchRangeKey {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v === "30d" || v === "90d" || v === "all") return v;
  return "7d";
}

export function describeAdminRange(key: AdminLaunchRangeKey): {
  fromIso: string;
  toIso: string;
  title: string;
} {
  const to = new Date();
  const from =
    key === "all"
      ? new Date("1970-01-01T00:00:00.000Z")
      : new Date(to.getTime() - (key === "30d" ? 30 : key === "90d" ? 90 : 7) * 86_400_000);
  const title =
    key === "all" ? "All time" : key === "30d" ? "Last 30 days" : key === "90d" ? "Last 90 days" : "Last 7 days";
  return { fromIso: from.toISOString(), toIso: to.toISOString(), title };
}

export type AdminLaunchDashboard = {
  range: AdminLaunchRangeKey;
  rangeTitle: string;
  fromIso: string;
  toIso: string;
  usersNew: number;
  resumesCreated: number;
  previewViewed: number;
  resumeStudioOpens: number;
  homepageCtaClicks: number;
  checkoutStarted: number;
  paymentsSucceededBeacon: number;
  revenuePaidCents: number;
  paymentsPaidCount: number;
  ordersCompleted: number;
  ordersPending: number;
  ordersFailed: number;
  pdfDownloadsDb: number;
  pdfDownloadBeacon: number;
  aiGenerationsOk: number;
  aiGenerationsFail: number;
};

async function countProductEvent(
  service: ReturnType<typeof createSupabaseServiceRoleClient>,
  event: string,
  fromIso: string,
  toIso: string,
): Promise<number> {
  const { count, error } = await service
    .from("product_analytics_events")
    .select("*", { count: "exact", head: true })
    .eq("event", event)
    .gte("created_at", fromIso)
    .lte("created_at", toIso);
  if (error) {
    if (!error.message.includes("does not exist")) {
      console.warn("[admin] product_analytics_events", event, error.message);
    }
    return 0;
  }
  return count ?? 0;
}

export async function getAdminLaunchDashboard(range: AdminLaunchRangeKey): Promise<AdminLaunchDashboard> {
  const { fromIso, toIso, title } = describeAdminRange(range);
  const service = createSupabaseServiceRoleClient();

  const [
    usersNew,
    resumesCreated,
    previewViewed,
    resumeStudioOpens,
    homepageCtaClicks,
    checkoutStarted,
    paymentsSucceededBeacon,
    revenueRpc,
    ordersCompleted,
    ordersPending,
    ordersFailed,
    pdfDownloadsDb,
    pdfDownloadBeacon,
    aiGenerationsOk,
    aiGenerationsFail,
    paymentsPaidCount,
  ] = await Promise.all([
    service
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", fromIso)
      .lte("created_at", toIso)
      .then((r) => (r.error ? 0 : r.count ?? 0)),
    service
      .from("resume_projects")
      .select("*", { count: "exact", head: true })
      .is("deleted_at", null)
      .gte("created_at", fromIso)
      .lte("created_at", toIso)
      .then((r) => (r.error ? 0 : r.count ?? 0)),
    countProductEvent(service, ANALYTICS_EVENTS.PREVIEW_VIEWED, fromIso, toIso),
    countProductEvent(service, ANALYTICS_EVENTS.RESUME_ST, fromIso, toIso),
    countProductEvent(service, ANALYTICS_EVENTS.HOMEPAGE_CTA_CLICKED, fromIso, toIso),
    countProductEvent(service, ANALYTICS_EVENTS.CHECKOUT_STARTED, fromIso, toIso),
    countProductEvent(service, ANALYTICS_EVENTS.PAYMENT_SUCCEEDED, fromIso, toIso),
    service.rpc("admin_sum_paid_cents_between", { p_from: fromIso, p_to: toIso }).then((r) => {
      if (r.error) return 0;
      const d = r.data;
      if (typeof d === "number") return d;
      if (typeof d === "string") return Number.parseInt(d, 10) || 0;
      return 0;
    }),
    service
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed")
      .gte("created_at", fromIso)
      .lte("created_at", toIso)
      .then((r) => (r.error ? 0 : r.count ?? 0)),
    service
      .from("orders")
      .select("*", { count: "exact", head: true })
      .in("status", ["pending", "processing"])
      .gte("created_at", fromIso)
      .lte("created_at", toIso)
      .then((r) => (r.error ? 0 : r.count ?? 0)),
    service
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "failed")
      .gte("created_at", fromIso)
      .lte("created_at", toIso)
      .then((r) => (r.error ? 0 : r.count ?? 0)),
    service
      .from("downloads")
      .select("*", { count: "exact", head: true })
      .gte("created_at", fromIso)
      .lte("created_at", toIso)
      .then((r) => (r.error ? 0 : r.count ?? 0)),
    countProductEvent(service, ANALYTICS_EVENTS.PDF_DOWNLOADED, fromIso, toIso),
    service
      .from("ai_generation_logs")
      .select("*", { count: "exact", head: true })
      .eq("ok", true)
      .gte("created_at", fromIso)
      .lte("created_at", toIso)
      .then((r) => (r.error ? 0 : r.count ?? 0)),
    service
      .from("ai_generation_logs")
      .select("*", { count: "exact", head: true })
      .eq("ok", false)
      .gte("created_at", fromIso)
      .lte("created_at", toIso)
      .then((r) => (r.error ? 0 : r.count ?? 0)),
    service
      .from("payments")
      .select("*", { count: "exact", head: true })
      .eq("status", "paid")
      .gte("created_at", fromIso)
      .lte("created_at", toIso)
      .then((r) => (r.error ? 0 : r.count ?? 0)),
  ]);

  return {
    range,
    rangeTitle: title,
    fromIso,
    toIso,
    usersNew,
    resumesCreated,
    previewViewed,
    resumeStudioOpens,
    homepageCtaClicks,
    checkoutStarted,
    paymentsSucceededBeacon,
    revenuePaidCents: revenueRpc,
    paymentsPaidCount,
    ordersCompleted,
    ordersPending,
    ordersFailed,
    pdfDownloadsDb,
    pdfDownloadBeacon,
    aiGenerationsOk,
    aiGenerationsFail,
  };
}

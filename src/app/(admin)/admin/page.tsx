import type { Metadata } from "next";
import Link from "next/link";
import { Activity, ArrowRight, ClipboardList, CreditCard, Download, FileText, Users } from "lucide-react";

import { AdminMetricCard } from "@/components/admin/admin-metric-card";
import { buttonVariants } from "@/components/ui/button";
import { formatUsdFromCents } from "@/lib/billing/format-money";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import { getAdminHealthProbe, getAdminOverviewMetrics } from "@/services/admin/overview";
import { getRollingFunnelSnapshot } from "@/services/analytics/snapshot";

export const metadata: Metadata = {
  title: "Admin · Overview",
  robots: { index: false, follow: false },
};

const quickLinks = [
  { href: ROUTES.admin.users, label: "Users", icon: Users, description: "Accounts and roles" },
  { href: ROUTES.admin.projects, label: "Projects", icon: FileText, description: "Resume projects" },
  { href: ROUTES.admin.orders, label: "Orders & payments", icon: CreditCard, description: "Commerce" },
  { href: ROUTES.admin.aiUsage, label: "AI usage", icon: Activity, description: "Generation logs" },
  { href: ROUTES.admin.downloads, label: "Downloads", icon: Download, description: "PDF exports" },
  { href: ROUTES.admin.audit, label: "Audit log", icon: ClipboardList, description: "Platform events" },
] as const;

export default async function AdminOverviewPage() {
  const [metrics, health, rolling] = await Promise.all([
    getAdminOverviewMetrics(),
    getAdminHealthProbe(),
    getRollingFunnelSnapshot(7),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <p className="text-eyebrow">Control center</p>
        <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Overview
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Operational snapshot of users, content, billing, AI, and system health. All figures are read-only.
        </p>
      </div>

      <section aria-labelledby="core-metrics" className="space-y-4">
        <h2
          id="core-metrics"
          className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
        >
          Core metrics
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AdminMetricCard tone="brand" label="Registered users" value={metrics.userCount} />
          <AdminMetricCard label="Resume projects" value={metrics.projectCount} hint="Excluding deleted" />
          <AdminMetricCard tone="success" label="Completed orders" value={metrics.completedOrderCount} />
          <AdminMetricCard
            tone="success"
            label="Recorded revenue"
            value={formatUsdFromCents(metrics.paymentTotalCents)}
            hint="Sum of paid payment rows"
          />
        </div>
      </section>

      <section aria-labelledby="activity-metrics" className="space-y-4">
        <h2
          id="activity-metrics"
          className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
        >
          Activity
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AdminMetricCard label="All orders" value={metrics.orderCount} />
          <AdminMetricCard label="PDF downloads" value={metrics.downloadCount} />
          <AdminMetricCard label="AI requests (total)" value={metrics.aiLogCount} />
          <AdminMetricCard
            tone={metrics.aiFailureCount24h > 0 ? "destructive" : "default"}
            label="AI failures (24h)"
            value={metrics.aiFailureCount24h}
            hint="Investigate spikes"
          />
        </div>
      </section>

      <section aria-labelledby="rolling-metrics" className="space-y-4">
        <h2
          id="rolling-metrics"
          className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
        >
          Last {rolling.windowDays} days (database)
        </h2>
        <p className="max-w-2xl text-xs text-muted-foreground">
          Rolling counts from Postgres — useful for funnel trends alongside structured analytics logs (see
          hosting logs for <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">analytics_event</code>{" "}
          lines).
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AdminMetricCard tone="brand" label="Projects created" value={rolling.projectsCreated} />
          <AdminMetricCard tone="success" label="Orders completed" value={rolling.ordersCompleted} />
          <AdminMetricCard label="AI generations (ok)" value={rolling.aiGenerationsSucceeded} />
          <AdminMetricCard label="PDF downloads" value={rolling.pdfDownloads} />
        </div>
      </section>

      <section className="relative overflow-hidden rounded-xl border border-border/70 bg-card p-6 shadow-soft sm:p-8">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-brand/8 blur-3xl"
          aria-hidden
        />
        <div className="relative">
          <p className="text-eyebrow">Platform health</p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2.5">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
                  health.ok
                    ? "bg-success/12 text-success ring-success/25"
                    : "bg-destructive/12 text-destructive ring-destructive/25",
                )}
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    health.ok ? "bg-success" : "bg-destructive",
                  )}
                  aria-hidden
                />
                {health.ok ? "API reachable" : "API check failed"}
              </span>
              <span className="text-sm text-muted-foreground">
                /api/health · <span className="tabular-nums">{health.latencyMs} ms</span>
              </span>
            </div>
            <Link
              href="/api/health"
              className={buttonVariants({ variant: "outline", size: "sm" })}
              target="_blank"
              rel="noreferrer"
            >
              View JSON
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Audit events (all time):{" "}
            <span className="font-semibold tabular-nums text-foreground">
              {metrics.auditLogCount}
            </span>
          </p>
        </div>
      </section>

      <section aria-labelledby="data-views" className="space-y-4">
        <h2
          id="data-views"
          className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
        >
          Data views
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map(({ href, label, icon: Icon, description }) => (
            <li key={href}>
              <Link
                href={href}
                className="group/card flex items-start gap-3 rounded-xl border border-border/70 bg-card p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-elevated"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-muted text-brand ring-1 ring-brand/15 transition-colors group-hover/card:bg-brand group-hover/card:text-brand-foreground">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1 font-semibold text-foreground">
                    {label}
                    <ArrowRight
                      className="size-4 shrink-0 opacity-50 transition-all group-hover/card:translate-x-0.5 group-hover/card:text-brand group-hover/card:opacity-100"
                      aria-hidden
                    />
                  </span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">{description}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

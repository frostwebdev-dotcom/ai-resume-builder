import type { Metadata } from "next";
import Link from "next/link";
import { Activity, ArrowRight, ClipboardList, CreditCard, Download, FileText, Users } from "lucide-react";

import { AdminMetricCard } from "@/components/admin/admin-metric-card";
import { buttonVariants } from "@/components/ui/button";
import { formatUsdFromCents } from "@/lib/billing/format-money";
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
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Overview
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Operational snapshot of users, content, billing, AI, and system health. All figures are read-only.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminMetricCard label="Registered users" value={metrics.userCount} />
        <AdminMetricCard label="Resume projects" value={metrics.projectCount} hint="Excluding deleted" />
        <AdminMetricCard label="Completed orders" value={metrics.completedOrderCount} />
        <AdminMetricCard
          label="Recorded revenue"
          value={formatUsdFromCents(metrics.paymentTotalCents)}
          hint="Sum of paid payment rows"
        />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminMetricCard label="All orders" value={metrics.orderCount} />
        <AdminMetricCard label="PDF downloads" value={metrics.downloadCount} />
        <AdminMetricCard label="AI requests (total)" value={metrics.aiLogCount} />
        <AdminMetricCard
          label="AI failures (24h)"
          value={metrics.aiFailureCount24h}
          hint="Investigate spikes"
        />
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Last {rolling.windowDays} days (database)
        </h2>
        <p className="mb-4 max-w-2xl text-xs text-muted-foreground">
          Rolling counts from Postgres — useful for funnel trends alongside structured analytics logs (see
          hosting logs for <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">analytics_event</code>{" "}
          lines).
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AdminMetricCard label="Projects created" value={rolling.projectsCreated} />
          <AdminMetricCard label="Orders completed" value={rolling.ordersCompleted} />
          <AdminMetricCard label="AI generations (ok)" value={rolling.aiGenerationsSucceeded} />
          <AdminMetricCard label="PDF downloads" value={rolling.pdfDownloads} />
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Platform health</h2>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span
              className={
                health.ok
                  ? "inline-flex rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-medium text-success"
                  : "inline-flex rounded-full bg-destructive/15 px-2.5 py-0.5 text-xs font-medium text-destructive"
              }
            >
              {health.ok ? "API reachable" : "API check failed"}
            </span>
            <span className="text-sm text-muted-foreground">
              /api/health · {health.latencyMs} ms
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
        <p className="mt-3 text-xs text-muted-foreground">
          Audit events (all time): <span className="font-medium text-foreground">{metrics.auditLogCount}</span>
        </p>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Data views
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map(({ href, label, icon: Icon, description }) => (
            <li key={href}>
              <Link
                href={href}
                className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/30 hover:bg-muted/20"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Icon className="size-5 text-foreground" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1 font-medium text-foreground">
                    {label}
                    <ArrowRight className="size-4 shrink-0 opacity-50" aria-hidden />
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

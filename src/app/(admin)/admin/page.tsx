import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  ClipboardList,
  CreditCard,
  Download,
  FileText,
  Headphones,
  Users,
} from "lucide-react";

import { AdminDateRangeBar } from "@/components/admin/admin-date-range-bar";
import { AdminMetricCard } from "@/components/admin/admin-metric-card";
import { buttonVariants } from "@/components/ui/button";
import { formatAdminDate, shortId } from "@/lib/admin/format";
import { formatUsdFromCents } from "@/lib/billing/format-money";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { getAdminHealthProbe, getAdminOverviewMetrics } from "@/services/admin/overview";
import { getAdminLaunchDashboard, parseAdminLaunchRange } from "@/services/admin/launch-metrics";
import { getAdminOrdersList } from "@/services/admin/orders";
import { getAdminUsersList } from "@/services/admin/users";

export const metadata: Metadata = {
  title: "Admin · Overview",
  robots: { index: false, follow: false },
};

function firstParam(v: string | string[] | undefined): string | undefined {
  if (v === undefined) return;
  return Array.isArray(v) ? v[0] : v;
}

const quickLinks = [
  { href: ROUTES.admin.users, label: "Users", icon: Users, description: "Accounts and roles" },
  { href: ROUTES.admin.projects, label: "Resumes", icon: FileText, description: "Resume projects" },
  { href: ROUTES.admin.orders, label: "Orders & payments", icon: CreditCard, description: "Commerce" },
  { href: ROUTES.admin.aiUsage, label: "AI usage", icon: Activity, description: "Generation logs" },
  { href: ROUTES.admin.downloads, label: "Downloads", icon: Download, description: "PDF exports" },
  { href: ROUTES.admin.support, label: "Support", icon: Headphones, description: "Contact & inbound" },
  { href: ROUTES.admin.audit, label: "Audit log", icon: ClipboardList, description: "Platform events" },
] as const;

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminOverviewPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const range = parseAdminLaunchRange(firstParam(sp.range));

  const [globals, dash, health, recentOrders, recentUsers] = await Promise.all([
    getAdminOverviewMetrics(),
    getAdminLaunchDashboard(range),
    getAdminHealthProbe(),
    getAdminOrdersList({ page: 1, pageSize: 10, q: undefined, status: undefined }),
    getAdminUsersList({ page: 1, pageSize: 10, q: undefined }),
  ]);

  const rangeHuman = `${formatAdminDate(dash.fromIso)} → ${formatAdminDate(dash.toIso)}`;

  const funnelResumeSignal = dash.resumesCreated + dash.resumeStudioOpens;
  const funnelPreview = dash.previewViewed;
  const funnelPay =
    dash.checkoutStarted > 0 || dash.ordersCompleted > 0 || dash.revenuePaidCents > 0;
  const funnelDownloads = dash.pdfDownloadsDb + dash.pdfDownloadBeacon;
  const funnelAi = dash.aiGenerationsOk + dash.aiGenerationsFail;

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-eyebrow">Control center</p>
          <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Launch overview
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Funnel and revenue for the selected window, plus all-time totals and recent activity. No resume
            body is shown here — only IDs, SKUs, and account metadata.
          </p>
        </div>
        <AdminDateRangeBar current={range} />
      </div>

      <section aria-labelledby="all-time" className="space-y-3">
        <h2
          id="all-time"
          className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
        >
          All-time totals
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AdminMetricCard tone="brand" label="Registered users" value={globals.userCount} />
          <AdminMetricCard label="Resume projects" value={globals.projectCount} hint="Excluding deleted" />
          <AdminMetricCard tone="success" label="Completed orders" value={globals.completedOrderCount} />
          <AdminMetricCard
            tone="success"
            label="Recorded revenue"
            value={formatUsdFromCents(globals.paymentTotalCents)}
            hint="Sum of paid payment rows"
          />
        </div>
      </section>

      <section
        aria-labelledby="launch-questions"
        className="rounded-xl border border-border/70 bg-muted/25 p-5 shadow-soft sm:p-6"
      >
        <h2
          id="launch-questions"
          className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
        >
          What this range answers
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">{rangeHuman}</p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <li className="rounded-lg border border-border/60 bg-card p-4 text-sm">
            <span className="font-semibold text-foreground">Are people starting resumes?</span>
            <p className="mt-1.5 text-muted-foreground">
              <span className="tabular-nums text-foreground">{funnelResumeSignal}</span> combined signal
              (projects created + studio opens from analytics).
            </p>
          </li>
          <li className="rounded-lg border border-border/60 bg-card p-4 text-sm">
            <span className="font-semibold text-foreground">Are people reaching preview?</span>
            <p className="mt-1.5 text-muted-foreground">
              <span className="tabular-nums text-foreground">{funnelPreview}</span> preview views (tracked
              events).
            </p>
          </li>
          <li className="rounded-lg border border-border/60 bg-card p-4 text-sm">
            <span className="font-semibold text-foreground">Are people paying?</span>
            <p className="mt-1.5 text-muted-foreground">
              Checkout starts <span className="tabular-nums text-foreground">{dash.checkoutStarted}</span>,
              completed orders <span className="tabular-nums text-foreground">{dash.ordersCompleted}</span>,
              revenue <span className="tabular-nums text-foreground">{formatUsdFromCents(dash.revenuePaidCents)}</span>
              {funnelPay ? "." : " — still quiet in this window."}
            </p>
          </li>
          <li className="rounded-lg border border-border/60 bg-card p-4 text-sm">
            <span className="font-semibold text-foreground">Are downloads working?</span>
            <p className="mt-1.5 text-muted-foreground">
              <span className="tabular-nums text-foreground">{funnelDownloads}</span> total (DB download rows +
              client PDF beacons).
            </p>
          </li>
          <li className="rounded-lg border border-border/60 bg-card p-4 text-sm sm:col-span-2 xl:col-span-2">
            <span className="font-semibold text-foreground">Are AI features being used?</span>
            <p className="mt-1.5 text-muted-foreground">
              <span className="tabular-nums text-foreground">{dash.aiGenerationsOk}</span> succeeded,{" "}
              <span className="tabular-nums text-foreground">{dash.aiGenerationsFail}</span> failed (
              <span className="tabular-nums text-foreground">{funnelAi}</span> total AI log rows).
            </p>
          </li>
        </ul>
      </section>

      <section aria-labelledby="range-metrics" className="space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
          <h2
            id="range-metrics"
            className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
          >
            {dash.rangeTitle} · funnel & commerce
          </h2>
          <p className="text-xs text-muted-foreground">Mix of Postgres tables and product analytics events.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AdminMetricCard tone="brand" label="New users (profiles)" value={dash.usersNew} />
          <AdminMetricCard label="Resumes created" value={dash.resumesCreated} hint="resume_projects rows" />
          <AdminMetricCard label="Preview viewed" value={dash.previewViewed} hint="Analytics beacon" />
          <AdminMetricCard label="Studio opens" value={dash.resumeStudioOpens} hint="resume_st events" />
          <AdminMetricCard label="Homepage CTA" value={dash.homepageCtaClicks} hint="Marketing clicks" />
          <AdminMetricCard label="Checkout started" value={dash.checkoutStarted} hint="Server + analytics" />
          <AdminMetricCard
            tone="success"
            label="Payments succeeded (beacon)"
            value={dash.paymentsSucceededBeacon}
            hint="payment_succeeded events"
          />
          <AdminMetricCard
            tone="success"
            label="Paid payments (rows)"
            value={dash.paymentsPaidCount}
            hint="payments.status = paid"
          />
          <AdminMetricCard
            tone="success"
            label="Revenue (paid)"
            value={formatUsdFromCents(dash.revenuePaidCents)}
            hint="RPC sum paid in range"
          />
          <AdminMetricCard tone="success" label="Orders completed" value={dash.ordersCompleted} />
          <AdminMetricCard label="Orders pending" value={dash.ordersPending} hint="pending / processing" />
          <AdminMetricCard
            tone={dash.ordersFailed > 0 ? "warning" : "default"}
            label="Orders failed"
            value={dash.ordersFailed}
            hint="Checkout or webhook failures"
          />
          <AdminMetricCard label="PDF downloads (DB)" value={dash.pdfDownloadsDb} />
          <AdminMetricCard label="PDF downloaded (beacon)" value={dash.pdfDownloadBeacon} />
          <AdminMetricCard label="AI generations ok" value={dash.aiGenerationsOk} />
          <AdminMetricCard
            tone={dash.aiGenerationsFail > 0 ? "destructive" : "default"}
            label="AI generations failed"
            value={dash.aiGenerationsFail}
          />
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
                  className={cn("size-1.5 rounded-full", health.ok ? "bg-success" : "bg-destructive")}
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
            <span className="font-semibold tabular-nums text-foreground">{globals.auditLogCount}</span>
          </p>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section aria-labelledby="recent-orders" className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2
              id="recent-orders"
              className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
            >
              Recent orders
            </h2>
            <Link
              href={ROUTES.admin.orders}
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1 text-xs")}
            >
              All orders
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </div>
          <div className="overflow-x-auto rounded-xl border border-border/70 bg-card shadow-soft">
            <table className="w-full min-w-[320px] text-left text-sm">
              <thead className="border-b border-border/80 bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">When</th>
                  <th className="px-3 py-2 font-medium">Order</th>
                  <th className="px-3 py-2 font-medium">SKU</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.rows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                      No orders yet.
                    </td>
                  </tr>
                ) : (
                  recentOrders.rows.map(({ order }) => (
                    <tr key={order.id} className="border-b border-border/50 last:border-0">
                      <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground tabular-nums">
                        {formatAdminDate(order.created_at)}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-xs text-foreground">{shortId(order.id)}</td>
                      <td className="max-w-[140px] truncate px-3 py-2.5 text-muted-foreground">{order.product_sku}</td>
                      <td className="px-3 py-2.5">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
                            order.status === "completed"
                              ? "bg-success/12 text-success ring-success/20"
                              : order.status === "failed"
                                ? "bg-destructive/12 text-destructive ring-destructive/20"
                                : "bg-muted text-muted-foreground ring-border",
                          )}
                        >
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="recent-users" className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2
              id="recent-users"
              className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
            >
              Recent users
            </h2>
            <Link
              href={ROUTES.admin.users}
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1 text-xs")}
            >
              All users
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </div>
          <div className="overflow-x-auto rounded-xl border border-border/70 bg-card shadow-soft">
            <table className="w-full min-w-[320px] text-left text-sm">
              <thead className="border-b border-border/80 bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Joined</th>
                  <th className="px-3 py-2 font-medium">Display</th>
                  <th className="px-3 py-2 font-medium">Role</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.rows.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-3 py-6 text-center text-muted-foreground">
                      No users yet.
                    </td>
                  </tr>
                ) : (
                  recentUsers.rows.map(({ profile, email }) => (
                    <tr key={profile.id} className="border-b border-border/50 last:border-0">
                      <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground tabular-nums">
                        {formatAdminDate(profile.created_at)}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="font-medium text-foreground">{profile.display_name ?? "—"}</span>
                        {email ? (
                          <span className="mt-0.5 block truncate text-xs text-muted-foreground">{email}</span>
                        ) : null}
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">{profile.role}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section aria-labelledby="data-views" className="space-y-4">
        <h2
          id="data-views"
          className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
        >
          Data views
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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

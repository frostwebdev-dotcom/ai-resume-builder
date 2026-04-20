import { CheckCircle2, Download, FileText, Sparkles } from "lucide-react";

import type { DashboardProject } from "@/services/projects/queries";
import { cn } from "@/lib/utils";

type Props = {
  projects: DashboardProject[];
  className?: string;
};

/**
 * Lightweight stats strip for the dashboard. All counts are derived from the
 * same list the grid renders, so nothing is ever "stale" relative to the UI.
 */
export function DashboardStats({ projects, className }: Props) {
  const total = projects.length;
  const ready = projects.filter(
    (p) => !p.isArchived && p.displayStatus !== "draft",
  ).length;
  const paid = projects.filter(
    (p) => p.displayStatus === "paid" || p.displayStatus === "downloaded",
  ).length;
  const downloaded = projects.filter(
    (p) => p.displayStatus === "downloaded",
  ).length;

  const items: {
    label: string;
    value: number;
    Icon: typeof FileText;
    tone: string;
  }[] = [
    { label: "Resumes", value: total, Icon: FileText, tone: "text-foreground" },
    {
      label: "Ready",
      value: ready,
      Icon: Sparkles,
      tone: "text-info",
    },
    { label: "Paid", value: paid, Icon: CheckCircle2, tone: "text-warning" },
    {
      label: "Downloaded",
      value: downloaded,
      Icon: Download,
      tone: "text-success",
    },
  ];

  return (
    <dl
      className={cn(
        "grid grid-cols-2 gap-2 sm:grid-cols-4",
        className,
      )}
      aria-label="Project stats"
    >
      {items.map(({ label, value, Icon, tone }) => (
        <div
          key={label}
          className="rounded-xl border border-border/70 bg-card px-3 py-2.5 shadow-soft"
        >
          <div className="flex items-center gap-2">
            <Icon className={cn("size-4", tone)} aria-hidden />
            <dt className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {label}
            </dt>
          </div>
          <dd className="mt-1 text-lg font-semibold tabular-nums text-foreground sm:text-xl">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

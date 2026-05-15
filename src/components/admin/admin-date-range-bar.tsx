import Link from "next/link";

import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { AdminLaunchRangeKey } from "@/services/admin/launch-metrics";

const OPTIONS: { value: AdminLaunchRangeKey; label: string }[] = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "all", label: "All time" },
];

type Props = {
  current: AdminLaunchRangeKey;
};

export function AdminDateRangeBar({ current }: Props) {
  return (
    <div
      className="flex flex-wrap items-center gap-2 rounded-xl border border-border/70 bg-card p-2 shadow-soft"
      role="group"
      aria-label="Date range"
    >
      <span className="px-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        Range
      </span>
      {OPTIONS.map(({ value, label }) => {
        const active = value === current;
        const href = value === "7d" ? ROUTES.admin.root : `${ROUTES.admin.root}?range=${value}`;
        return (
          <Link
            key={value}
            href={href}
            aria-current={active ? "true" : undefined}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-brand text-brand-foreground shadow-soft"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}

import Link from "next/link";

import { cn } from "@/lib/utils";

export type FilterChipItem = {
  label: string;
  /** Omit param when selected (e.g. "all") */
  paramValue?: string;
};

type AdminFilterChipsProps = {
  basePath: string;
  paramName: string;
  items: FilterChipItem[];
  current?: string;
  /** Preserve these query params */
  preserve?: Record<string, string | undefined>;
};

function buildUrl(
  basePath: string,
  paramName: string,
  paramValue: string | undefined,
  preserve: Record<string, string | undefined> | undefined,
): string {
  const u = new URLSearchParams();
  u.set("page", "1");
  if (preserve) {
    for (const [k, v] of Object.entries(preserve)) {
      if (v !== undefined && v !== "" && k !== paramName) u.set(k, v);
    }
  }
  if (paramValue) u.set(paramName, paramValue);
  const qs = u.toString();
  return qs ? `${basePath}?${qs}` : `${basePath}?page=1`;
}

export function AdminFilterChips({ basePath, paramName, items, current, preserve }: AdminFilterChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const selected = item.paramValue ? current === item.paramValue : !current;

        return (
          <Link
            key={item.label + (item.paramValue ?? "all")}
            href={buildUrl(basePath, paramName, item.paramValue, preserve)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors sm:text-sm",
              selected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

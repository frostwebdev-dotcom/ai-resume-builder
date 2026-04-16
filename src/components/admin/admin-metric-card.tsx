import { cn } from "@/lib/utils";

type AdminMetricTone = "default" | "brand" | "success" | "warning" | "destructive";

type AdminMetricCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  className?: string;
  /** Subtle accent to signal what the number means. */
  tone?: AdminMetricTone;
};

const toneAccent: Record<AdminMetricTone, string> = {
  default: "bg-foreground/30",
  brand: "bg-brand",
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
};

export function AdminMetricCard({
  label,
  value,
  hint,
  className,
  tone = "default",
}: AdminMetricCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border/70 bg-card px-5 py-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-elevated sm:px-6 sm:py-6",
        className,
      )}
    >
      <span
        className={cn(
          "absolute left-0 top-0 h-full w-0.5 opacity-70 transition-opacity group-hover:opacity-100",
          toneAccent[tone],
        )}
        aria-hidden
      />
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 font-heading text-2xl font-semibold tracking-tight tabular-nums text-foreground sm:text-3xl">
        {value}
      </p>
      {hint ? (
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

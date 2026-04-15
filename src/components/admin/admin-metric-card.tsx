import { cn } from "@/lib/utils";

type AdminMetricCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  className?: string;
};

export function AdminMetricCard({ label, value, hint, className }: AdminMetricCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card px-4 py-4 shadow-sm sm:px-5 sm:py-5",
        className,
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 font-heading text-2xl font-semibold tabular-nums text-foreground sm:text-3xl">
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

import { cn } from "@/lib/utils";

type ResumePreviewMockProps = {
  className?: string;
  /** Slight variation for “template” cards */
  variant?: "classic" | "modern";
  /**
   * When set, the mock is exposed as a single labeled graphic for assistive tech.
   * Omit for purely decorative use (e.g. hidden from AT with `aria-hidden`).
   */
  ariaLabel?: string;
};

/**
 * Lightweight CSS-only preview — no images for fast LCP on mobile.
 */
export function ResumePreviewMock({
  className,
  variant = "classic",
  ariaLabel,
}: ResumePreviewMockProps) {
  const a11y = ariaLabel
    ? ({ role: "img" as const, "aria-label": ariaLabel } as const)
    : ({ "aria-hidden": true as const } as const);

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-4 shadow-sm ring-1 ring-foreground/5 sm:p-5",
        variant === "modern" && "border-primary/15 bg-gradient-to-b from-card to-muted/40",
        className,
      )}
      {...a11y}
    >
      <div className="mb-4 flex items-center gap-3 border-b border-border/80 pb-3">
        <div className="size-10 rounded-full bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-2.5 w-32 rounded bg-foreground/80" />
          <div className="h-2 w-24 rounded bg-muted-foreground/40" />
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-2 w-full rounded bg-muted-foreground/25" />
        <div className="h-2 w-[92%] rounded bg-muted-foreground/20" />
        <div className="h-2 w-[88%] rounded bg-muted-foreground/20" />
      </div>
      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <div className="space-y-2 rounded-md bg-muted/50 p-3">
          <div className="h-2 w-16 rounded bg-foreground/50" />
          <div className="h-1.5 w-full rounded bg-muted-foreground/25" />
          <div className="h-1.5 w-[90%] rounded bg-muted-foreground/20" />
        </div>
        <div className="space-y-2 rounded-md bg-muted/50 p-3">
          <div className="h-2 w-20 rounded bg-foreground/50" />
          <div className="h-1.5 w-full rounded bg-muted-foreground/25" />
          <div className="h-1.5 w-[85%] rounded bg-muted-foreground/20" />
        </div>
      </div>
    </div>
  );
}

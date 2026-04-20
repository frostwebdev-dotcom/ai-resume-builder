import { cn } from "@/lib/utils";

export function ResumePreviewSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl border border-border/60 bg-card p-[clamp(10mm,3vw,14mm)] shadow-sm ring-1 ring-foreground/5",
        "mx-auto w-[210mm] max-w-full min-h-[297mm]",
        className,
      )}
      aria-hidden
    >
      <div className="space-y-3 border-b border-border/50 pb-4">
        <div className="mx-auto h-7 max-w-[60%] rounded-md bg-muted" />
        <div className="mx-auto h-3 max-w-[40%] rounded bg-muted" />
        <div className="mx-auto h-3 max-w-[70%] rounded bg-muted/80" />
      </div>
      <div className="mt-6 space-y-3">
        <div className="h-2 w-24 rounded bg-muted" />
        <div className="h-2 w-full rounded bg-muted/60" />
        <div className="h-2 w-[92%] rounded bg-muted/50" />
        <div className="h-2 w-[88%] rounded bg-muted/50" />
      </div>
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <div className="space-y-2 rounded-lg bg-muted/40 p-3">
          <div className="h-2 w-20 rounded bg-muted" />
          <div className="h-2 w-full rounded bg-muted/50" />
          <div className="h-2 w-[90%] rounded bg-muted/40" />
        </div>
        <div className="space-y-2 rounded-lg bg-muted/40 p-3">
          <div className="h-2 w-24 rounded bg-muted" />
          <div className="h-2 w-full rounded bg-muted/50" />
        </div>
      </div>
    </div>
  );
}

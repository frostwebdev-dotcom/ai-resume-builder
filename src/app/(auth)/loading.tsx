import { PageContainer } from "@/components/layout/page-container";

/**
 * Instant fallback for auth routes — matches the auth-card visual shape.
 */
export default function AuthLoading() {
  return (
    <PageContainer className="flex min-h-dvh flex-1 flex-col justify-center py-10 pb-safe sm:min-h-0 sm:py-16">
      <div className="mx-auto w-full max-w-[min(100%,24rem)]">
        <div className="mb-8 flex flex-col items-center gap-4">
          <div
            aria-hidden
            className="h-8 w-40 animate-pulse rounded-lg bg-brand-muted"
          />
          <div
            aria-hidden
            className="h-5 w-64 animate-pulse rounded-full bg-muted/70"
          />
        </div>
        <div className="space-y-4 rounded-2xl border border-border/70 bg-card p-6 shadow-soft sm:p-8">
          <div
            aria-hidden
            className="h-11 w-full animate-pulse rounded-lg bg-muted/60"
          />
          <div
            aria-hidden
            className="h-11 w-full animate-pulse rounded-lg bg-muted/60"
          />
          <div
            aria-hidden
            className="h-12 w-full animate-pulse rounded-lg bg-brand/20"
          />
        </div>
        <span className="sr-only" role="status" aria-live="polite">
          Loading…
        </span>
      </div>
    </PageContainer>
  );
}

import { PageContainer } from "@/components/layout/page-container";
import { MktSection } from "@/components/marketing/mkt-section";

/**
 * Instant fallback for any marketing route while the RSC payload streams in.
 * Uses the same chrome tokens (aurora hero, brand-muted surfaces) so the
 * transition into the final page is seamless rather than a blank flash.
 */
export default function MarketingLoading() {
  return (
    <>
      <MktSection
        aria-hidden
        className="relative overflow-hidden border-b border-border/60 bg-aurora pb-16 pt-12 sm:pb-20 sm:pt-16"
      >
        <PageContainer className="relative">
          <div className="mx-auto max-w-3xl text-center">
            <div
              aria-hidden
              className="mx-auto h-5 w-40 animate-pulse rounded-full bg-brand-muted"
            />
            <div className="mt-6 space-y-3">
              <div
                aria-hidden
                className="mx-auto h-7 w-4/5 animate-pulse rounded-lg bg-muted/80 sm:h-9"
              />
              <div
                aria-hidden
                className="mx-auto h-7 w-3/5 animate-pulse rounded-lg bg-muted/60 sm:h-9"
              />
            </div>
            <div
              aria-hidden
              className="mx-auto mt-5 h-4 w-2/3 animate-pulse rounded-full bg-muted/60"
            />
            <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <div
                aria-hidden
                className="h-12 w-full animate-pulse rounded-lg bg-brand/20 sm:w-36"
              />
              <div
                aria-hidden
                className="h-12 w-full animate-pulse rounded-lg bg-muted/70 sm:w-36"
              />
            </div>
          </div>
        </PageContainer>
      </MktSection>
      <MktSection aria-hidden>
        <PageContainer>
          <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-40 animate-pulse rounded-xl border border-border/70 bg-card shadow-soft"
                style={{ animationDelay: `${i * 80}ms` }}
              />
            ))}
          </div>
        </PageContainer>
      </MktSection>
      <span className="sr-only" role="status" aria-live="polite">
        Loading page…
      </span>
    </>
  );
}

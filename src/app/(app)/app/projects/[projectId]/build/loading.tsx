import { PageContainer } from "@/components/layout/page-container";

export default function BuildLoading() {
  return (
    <section className="py-6 sm:py-10">
      <PageContainer className="max-w-3xl">
        <div className="animate-pulse space-y-6">
          <div className="h-4 w-32 rounded bg-muted" />
          <div className="h-10 max-w-sm rounded-lg bg-muted" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-8 w-16 rounded-full bg-muted" />
            ))}
          </div>
          <div className="h-40 rounded-xl bg-muted/70" />
        </div>
      </PageContainer>
    </section>
  );
}

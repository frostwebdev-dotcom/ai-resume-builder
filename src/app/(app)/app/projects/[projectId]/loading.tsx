import { PageContainer } from "@/components/layout/page-container";

export default function ProjectDetailLoading() {
  return (
    <section className="py-6 sm:py-10">
      <PageContainer>
        <div className="animate-pulse space-y-8">
          <div className="h-4 w-24 rounded bg-muted" />
          <div className="space-y-3 border-b border-border/60 pb-8">
            <div className="h-10 max-w-md rounded-lg bg-muted" />
            <div className="h-6 w-40 rounded bg-muted" />
          </div>
          <div className="h-40 rounded-xl bg-muted/60" />
        </div>
      </PageContainer>
    </section>
  );
}

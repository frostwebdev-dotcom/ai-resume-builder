import { PageContainer } from "@/components/layout/page-container";
import { ResumePreviewSkeleton } from "@/components/resume-preview/resume-preview-skeleton";

export default function PreviewLoading() {
  return (
    <section className="min-h-0 flex-1 py-4 sm:py-8">
      <PageContainer className="max-w-4xl">
        <div className="space-y-4">
          <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-full max-w-md animate-pulse rounded bg-muted/70" />
          <ResumePreviewSkeleton />
        </div>
      </PageContainer>
    </section>
  );
}

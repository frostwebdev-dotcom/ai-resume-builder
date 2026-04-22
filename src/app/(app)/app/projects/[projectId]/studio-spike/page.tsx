import Link from "next/link";
import { notFound } from "next/navigation";

import { PageContainer } from "@/components/layout/page-container";
import { ROUTES } from "@/lib/constants";
import { requireUser } from "@/lib/auth/guards";
import { getProjectDetailForUser } from "@/services/projects/queries";
import { StudioSpikeClient } from "./studio-spike-client";

type PageProps = {
  params: Promise<{ projectId: string }>;
};

/**
 * Temporary dev route: prove GuestStudioEditor mounts under AppShell + auth.
 * Spike only — delete this directory when done.
 */
export default async function StudioSpikePage({ params }: PageProps) {
  const { projectId } = await params;
  const spikePath = `/app/projects/${projectId}/studio-spike`;
  const { user } = await requireUser({ nextPath: spikePath });

  const detail = await getProjectDetailForUser(user.id, projectId);
  if (!detail) {
    notFound();
  }

  return (
    <PageContainer className="flex min-h-0 flex-1 flex-col py-4 sm:py-6">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Link
          href={ROUTES.app.project(projectId)}
          className="font-medium text-foreground underline-offset-2 hover:underline"
        >
          ← Back to project
        </Link>
        <span aria-hidden>·</span>
        <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">studio-spike</span>
      </div>
      <StudioSpikeClient projectId={projectId} projectTitle={detail.project.title} />
    </PageContainer>
  );
}

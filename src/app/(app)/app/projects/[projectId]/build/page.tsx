import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageContainer } from "@/components/layout/page-container";
import { ResumeWizard } from "@/components/resume-wizard/resume-wizard";
import { ROUTES } from "@/lib/constants";
import { getOptionalAuth, requireUser } from "@/lib/auth/guards";
import { getProjectDetailForUser } from "@/services/projects/queries";
import {
  fetchJobTargetForProject,
  toJobTargetClientView,
} from "@/services/job-target/queries";
import { fetchWizardStateForProject } from "@/services/resume-wizard/actions";

type PageProps = {
  params: Promise<{ projectId: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { projectId } = await params;
  const ctx = await getOptionalAuth();
  if (!ctx) return { title: "Build resume" };
  const detail = await getProjectDetailForUser(ctx.user.id, projectId);
  if (!detail) return { title: "Build resume" };
  return {
    title: `Build · ${detail.project.title}`,
    description: "Step-by-step resume builder with autosave.",
  };
}

export default async function ProjectBuildPage({ params }: PageProps) {
  const { projectId } = await params;
  const { user } = await requireUser({ nextPath: ROUTES.app.projectBuild(projectId) });

  const [detail, wizard, jobTargetRow] = await Promise.all([
    getProjectDetailForUser(user.id, projectId),
    fetchWizardStateForProject(user.id, projectId),
    fetchJobTargetForProject(user.id, projectId),
  ]);

  if (!detail || !wizard) {
    notFound();
  }

  const initialJobTarget = toJobTargetClientView(jobTargetRow);

  return (
    <section className="min-h-0 flex-1 py-4 sm:py-8">
      <PageContainer className="max-w-3xl">
        <ResumeWizard
          key={projectId}
          projectId={projectId}
          projectTitle={detail.project.title}
          initialState={wizard}
          initialJobTarget={initialJobTarget}
        />
      </PageContainer>
    </section>
  );
}

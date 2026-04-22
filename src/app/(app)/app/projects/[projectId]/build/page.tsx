import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageContainer } from "@/components/layout/page-container";
import { ProjectStudioShell } from "@/components/resume-wizard/project-studio-shell";
import { ROUTES } from "@/lib/constants";
import { getOptionalAuth, requireUser } from "@/lib/auth/guards";
import { parseProjectMetadata } from "@/lib/projects/metadata";
import { templateIdToSlug } from "@/lib/resume-preview/resolve-slug";
import { DEFAULT_TEMPLATE_ID } from "@/lib/resume-preview/template-ids";
import { DEFAULT_RESUME_STYLE_V1 } from "@/lib/resume-preview/resume-style";
import {
  createSignedAvatarUrl,
  isAvatarPathOwnedBy,
} from "@/lib/supabase/avatar-storage";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
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
  if (!ctx) return { title: "Draft resume" };
  const detail = await getProjectDetailForUser(ctx.user.id, projectId);
  if (!detail) return { title: "Draft resume" };
  return {
    title: `Draft · ${detail.project.title}`,
    description:
      "Studio resume draft with live preview (same editor as the public builder). Open Preview & export to choose a template and export a PDF.",
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

  // Resolve everything the live preview needs up front so the client paint
  // matches what the Preview page would render (template + style + avatar).
  const templateSlug = templateIdToSlug(
    detail.project.template_id ?? DEFAULT_TEMPLATE_ID,
  );
  const meta = parseProjectMetadata(detail.project.metadata);
  const initialResumeStyle = meta.resume_style ?? DEFAULT_RESUME_STYLE_V1;

  let avatarSignedUrl: string | null = null;
  if (meta.avatar_path && isAvatarPathOwnedBy(meta.avatar_path, user.id, projectId)) {
    const service = createSupabaseServiceRoleClient();
    avatarSignedUrl = await createSignedAvatarUrl(service, meta.avatar_path, 60 * 15);
  }

  return (
    <section className="min-h-0 flex-1 py-4 sm:py-8">
      <PageContainer className="max-w-[1400px] xl:px-6 2xl:px-8">
        <ProjectStudioShell
          key={projectId}
          projectId={projectId}
          projectTitle={detail.project.title}
          initialWizard={wizard}
          initialJobTarget={initialJobTarget}
          templateSlug={templateSlug}
          initialResumeStyle={initialResumeStyle}
          avatarSignedUrl={avatarSignedUrl}
        />
      </PageContainer>
    </section>
  );
}

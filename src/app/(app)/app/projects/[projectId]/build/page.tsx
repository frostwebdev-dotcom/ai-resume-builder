import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProjectStudioShell } from "@/components/resume-wizard/project-studio-shell";
import { ROUTES } from "@/lib/constants";
import { getOptionalAuth, requireUser } from "@/lib/auth/guards";
import { parseProjectMetadata } from "@/lib/projects/metadata";
import { templateIdToSlug } from "@/lib/resume-preview/resolve-slug";
import { DEFAULT_TEMPLATE_ID } from "@/lib/resume-preview/template-ids";
import { DEFAULT_RESUME_STYLE_V1 } from "@/lib/resume-preview/resume-style";
import { isStripeCheckoutConfigured } from "@/lib/billing/checkout-config";
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
import { getResumeDownloadAccess } from "@/services/downloads/queries";
import { fetchWizardStateForProject } from "@/services/resume-wizard/actions";

type PageProps = {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ checkout?: string | string[] }>;
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
      "Studio resume draft with live preview (same editor as the public builder). Pay once to unlock and download a final PDF.",
  };
}

export default async function ProjectBuildPage({ params, searchParams }: PageProps) {
  const { projectId } = await params;
  const query = await searchParams;
  const checkoutStatus = Array.isArray(query.checkout) ? query.checkout[0] : query.checkout;
  const { user, profile } = await requireUser({ nextPath: ROUTES.app.projectBuild(projectId) });

  const [detail, wizard, jobTargetRow, downloadAccess] = await Promise.all([
    getProjectDetailForUser(user.id, projectId),
    fetchWizardStateForProject(user.id, projectId),
    fetchJobTargetForProject(user.id, projectId),
    getResumeDownloadAccess(user.id, projectId),
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
    <section className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-slate-50 p-0">
      <h1 className="sr-only">
        Draft resume — {detail.project.title}; same studio editor as the public builder; preview and
        export from the header or footer when you are ready.
      </h1>
      <ProjectStudioShell
        key={projectId}
        projectId={projectId}
        projectTitle={detail.project.title}
        initialWizard={wizard}
        initialJobTarget={initialJobTarget}
        templateSlug={templateSlug}
        initialResumeStyle={initialResumeStyle}
        avatarSignedUrl={avatarSignedUrl}
        canDownload={downloadAccess.canDownload}
        checkoutStatus={
          checkoutStatus === "success" ||
          checkoutStatus === "pending" ||
          checkoutStatus === "failed" ||
          checkoutStatus === "cancelled"
            ? checkoutStatus
            : undefined
        }
        checkoutEnabled={isStripeCheckoutConfigured()}
        showPaymentSetupDetails={profile.role === "admin" || process.env.NODE_ENV !== "production"}
      />
    </section>
  );
}

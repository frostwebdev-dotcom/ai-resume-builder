import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageContainer } from "@/components/layout/page-container";
import { ProjectPreviewClient } from "@/components/resume-preview/project-preview-client";
import { parseProjectMetadata } from "@/lib/projects/metadata";
import { DEFAULT_RESUME_STYLE_V1 } from "@/lib/resume-preview/resume-style";
import { ROUTES } from "@/lib/constants";
import { getOptionalAuth, requireUser } from "@/lib/auth/guards";
import { mapWizardToPreviewDocument } from "@/lib/resume-preview/map-wizard-to-preview";
import { getProjectDetailForUser } from "@/services/projects/queries";
import { fetchWizardStateForProject } from "@/services/resume-wizard/actions";
import { listTemplatesForUi } from "@/services/templates/queries";
import { isStripeCheckoutConfigured } from "@/lib/billing/checkout-config";
import { getResumeDownloadAccess } from "@/services/downloads/queries";
import {
  createSignedAvatarUrl,
  isAvatarPathOwnedBy,
} from "@/lib/supabase/avatar-storage";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

export const maxDuration = 60;

type PageProps = {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ checkout?: string | string[] }>;
};

function parseCheckoutNotice(
  raw: string | string[] | undefined,
): "success" | "failed" | "cancelled" | null {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v === "success") return "success";
  if (v === "failed") return "failed";
  if (v === "cancelled") return "cancelled";
  return null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { projectId } = await params;
  const ctx = await getOptionalAuth();
  if (!ctx) return { title: "Preview & export" };
  const detail = await getProjectDetailForUser(ctx.user.id, projectId);
  if (!detail) return { title: "Preview & export" };
  return {
    title: `Preview & export · ${detail.project.title}`,
    description:
      "Preview this resume project, pick a template and appearance, then export a PDF when you are ready.",
  };
}

export default async function ProjectPreviewPage({ params, searchParams }: PageProps) {
  const { projectId } = await params;
  const sp = await searchParams;
  const checkoutNotice = parseCheckoutNotice(sp.checkout);
  const { user } = await requireUser({ nextPath: ROUTES.app.projectPreview(projectId) });

  const [detail, wizard, templates, downloadAccess] = await Promise.all([
    getProjectDetailForUser(user.id, projectId),
    fetchWizardStateForProject(user.id, projectId),
    listTemplatesForUi(),
    getResumeDownloadAccess(user.id, projectId),
  ]);

  if (!detail || !wizard) {
    notFound();
  }

  const checkoutEnabled = isStripeCheckoutConfigured();
  const meta = parseProjectMetadata(detail.project.metadata);
  const initialResumeStyle = meta.resume_style ?? DEFAULT_RESUME_STYLE_V1;

  // Resolve avatar: short-lived signed URL for private bucket preview.
  let avatarSignedUrl: string | null = null;
  if (meta.avatar_path && isAvatarPathOwnedBy(meta.avatar_path, user.id, projectId)) {
    const service = createSupabaseServiceRoleClient();
    avatarSignedUrl = await createSignedAvatarUrl(service, meta.avatar_path, 60 * 15);
  }

  const document = mapWizardToPreviewDocument(wizard, { avatarUrl: avatarSignedUrl });

  return (
    <section className="min-h-0 flex-1 py-4 sm:py-8">
      <PageContainer className="max-w-[1400px] xl:px-6 2xl:px-8">
        <ProjectPreviewClient
          key={projectId}
          projectId={projectId}
          projectTitle={detail.project.title}
          document={document}
          templates={templates}
          selectedTemplateId={detail.project.template_id}
          downloadAccess={downloadAccess}
          checkoutEnabled={checkoutEnabled}
          initialResumeStyle={initialResumeStyle}
          initialAvatarSignedUrl={avatarSignedUrl}
          checkoutNotice={checkoutNotice}
        />
      </PageContainer>
    </section>
  );
}

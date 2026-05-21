import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageContainer } from "@/components/layout/page-container";
import { PreviewExportClient } from "@/components/resume-preview/preview-export-client";
import { getOptionalAuth, requireUser } from "@/lib/auth/guards";
import { isStripeCheckoutConfigured } from "@/lib/billing/checkout-config";
import { ROUTES } from "@/lib/constants";
import { parseProjectMetadata } from "@/lib/projects/metadata";
import { mapWizardToPreviewDocument } from "@/lib/resume-preview/map-wizard-to-preview";
import { DEFAULT_RESUME_STYLE_V1 } from "@/lib/resume-preview/resume-style";
import {
  createSignedAvatarUrl,
  isAvatarPathOwnedBy,
} from "@/lib/supabase/avatar-storage";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { getResumeDownloadAccess } from "@/services/downloads/queries";
import { getProjectDetailForUser } from "@/services/projects/queries";
import { fetchWizardStateForProject } from "@/services/resume-wizard/actions";
import { listTemplatesForUi } from "@/services/templates/queries";

export const maxDuration = 60;

type PageProps = {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ checkout?: string | string[] }>;
};

function parseCheckoutNotice(
  raw: string | string[] | undefined,
): "success" | "failed" | "cancelled" | "pending" | null {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v === "success") return "success";
  if (v === "failed") return "failed";
  if (v === "cancelled") return "cancelled";
  if (v === "pending") return "pending";
  return null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { projectId } = await params;
  const ctx = await getOptionalAuth();
  if (!ctx) return { title: "Resume Preview & Export" };
  const detail = await getProjectDetailForUser(ctx.user.id, projectId);
  if (!detail) return { title: "Resume Preview & Export" };
  return {
    title: `Resume Preview & Export · ${detail.project.title || "Resume Preview"}`,
    description: "Review your resume, run an optional AI review, and unlock your final PDF.",
  };
}

export default async function PreviewExportPage({ params, searchParams }: PageProps) {
  const { projectId } = await params;
  const sp = await searchParams;
  const checkoutNotice = parseCheckoutNotice(sp.checkout);
  const { user, profile } = await requireUser({
    nextPath: ROUTES.app.projectPreviewExport(projectId),
  });

  const [detail, wizard, templates, downloadAccess] = await Promise.all([
    getProjectDetailForUser(user.id, projectId),
    fetchWizardStateForProject(user.id, projectId),
    listTemplatesForUi(),
    getResumeDownloadAccess(user.id, projectId),
  ]);

  if (!detail || !wizard) {
    notFound();
  }

  const meta = parseProjectMetadata(detail.project.metadata);
  const initialResumeStyle = meta.resume_style ?? DEFAULT_RESUME_STYLE_V1;

  let avatarSignedUrl: string | null = null;
  if (meta.avatar_path && isAvatarPathOwnedBy(meta.avatar_path, user.id, projectId)) {
    const service = createSupabaseServiceRoleClient();
    avatarSignedUrl = await createSignedAvatarUrl(service, meta.avatar_path, 60 * 15);
  }

  const document = mapWizardToPreviewDocument(wizard, { avatarUrl: avatarSignedUrl });
  const showPaymentSetupDetails =
    profile.role === "admin" || process.env.NODE_ENV !== "production";

  return (
    <section className="min-h-0 min-w-0 flex-1 overflow-x-clip py-4 sm:py-8">
      <PageContainer className="max-w-[1480px] xl:px-6 2xl:px-8">
        <PreviewExportClient
          projectId={projectId}
          projectTitle={detail.project.title}
          document={document}
          templates={templates}
          selectedTemplateId={detail.project.template_id}
          downloadAccess={downloadAccess}
          checkoutEnabled={isStripeCheckoutConfigured()}
          showPaymentSetupDetails={showPaymentSetupDetails}
          initialResumeStyle={initialResumeStyle}
          checkoutNotice={checkoutNotice}
        />
      </PageContainer>
    </section>
  );
}

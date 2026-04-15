import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageContainer } from "@/components/layout/page-container";
import { ProjectPreviewClient } from "@/components/resume-preview/project-preview-client";
import { ROUTES } from "@/lib/constants";
import { getOptionalAuth, requireUser } from "@/lib/auth/guards";
import { mapWizardToPreviewDocument } from "@/lib/resume-preview/map-wizard-to-preview";
import { getProjectDetailForUser } from "@/services/projects/queries";
import { fetchWizardStateForProject } from "@/services/resume-wizard/actions";
import { listTemplatesForUi } from "@/services/templates/queries";
import { getResumeDownloadAccess } from "@/services/downloads/queries";

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
  if (!ctx) return { title: "Preview" };
  const detail = await getProjectDetailForUser(ctx.user.id, projectId);
  if (!detail) return { title: "Preview" };
  return {
    title: `Preview · ${detail.project.title}`,
    description: "Resume preview and template selection.",
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

  const document = mapWizardToPreviewDocument(wizard);

  return (
    <section className="min-h-0 flex-1 py-4 sm:py-8">
      <PageContainer className="max-w-4xl">
        <ProjectPreviewClient
          projectId={projectId}
          projectTitle={detail.project.title}
          document={document}
          templates={templates}
          selectedTemplateId={detail.project.template_id}
          downloadAccess={downloadAccess}
          checkoutNotice={checkoutNotice}
        />
      </PageContainer>
    </section>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { ProjectDetailActions } from "@/components/projects/project-detail-actions";
import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
import { TemplateCatalogLivePreview } from "@/components/templates/template-catalog-live-preview";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import { templateIdToSlug } from "@/lib/resume-preview/resolve-slug";
import { getTemplateTheme } from "@/lib/resume-preview/template-theme";
import { cn } from "@/lib/utils";
import { getOptionalAuth, requireUser } from "@/lib/auth/guards";
import { getProjectDetailForUser } from "@/services/projects/queries";

type PageProps = {
  params: Promise<{ projectId: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { projectId } = await params;
  const ctx = await getOptionalAuth();
  if (!ctx) return { title: "Resume project" };
  const detail = await getProjectDetailForUser(ctx.user.id, projectId);
  if (!detail) return { title: "Resume project" };
  return {
    title: detail.project.title,
    description:
      "Resume project hub: open Draft for the studio editor with live preview and autosave to this project.",
  };
}

function formatUpdated(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { projectId } = await params;
  const { user } = await requireUser({ nextPath: ROUTES.app.project(projectId) });
  const detail = await getProjectDetailForUser(user.id, projectId);
  if (!detail) notFound();

  const { project, displayLabel, displayStatus, isArchived } = detail;
  const templateSlug = templateIdToSlug(project.template_id);
  const templateTheme = getTemplateTheme(templateSlug);

  return (
    <section className="min-w-0 py-6 sm:py-10">
      <PageContainer>
        <div className="space-y-8">
          <div>
            <Link
              href={ROUTES.app.root}
              className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline sm:min-h-0"
            >
              <ArrowLeft className="size-4" aria-hidden />
              All resumes
            </Link>
          </div>

          <div className="flex min-w-0 flex-col gap-6 border-b border-border/70 pb-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 space-y-3">
              <p className="text-eyebrow">Resume project</p>
              <h1 className="text-balance text-display text-foreground">{project.title}</h1>
              <div className="flex flex-wrap items-center gap-2">
                <ProjectStatusBadge
                  label={displayLabel}
                  displayStatus={displayStatus}
                  isArchived={isArchived}
                />
                <span className="text-sm text-muted-foreground">
                  Updated {formatUpdated(project.updated_at)}
                </span>
              </div>
            </div>
            <ProjectDetailActions detail={detail} />
          </div>

          <div className="max-w-3xl">
            <Link
              href={ROUTES.app.projectBuild(projectId)}
              className="group/draft relative block overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 shadow-[0_1px_3px_rgba(15,23,42,0.06)] transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_8px_28px_rgba(15,23,42,0.1)] sm:p-8"
            >
              <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:gap-10">
                <div className="mx-auto w-full max-w-[12.5rem] shrink-0 sm:mx-0 sm:max-w-[13.5rem]">
                  <div
                    className={cn(
                      "relative overflow-hidden rounded-md bg-white p-1.5",
                      "shadow-[0_1px_2px_rgba(15,23,42,0.05),0_4px_14px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.85)]",
                      "ring-1 ring-slate-200/50",
                      "transition-[box-shadow,ring-color] duration-200 ease-out",
                      "group-hover/draft:shadow-[0_2px_6px_rgba(15,23,42,0.07),0_10px_28px_rgba(15,23,42,0.09),inset_0_1px_0_rgba(255,255,255,0.9)]",
                      "group-hover/draft:ring-slate-300/70",
                    )}
                  >
                    <TemplateCatalogLivePreview
                      slug={templateSlug}
                      eager
                      className="shadow-none ring-0"
                    />
                  </div>
                  <p className="mt-2.5 text-center text-xs font-medium leading-snug text-slate-500 sm:text-left">
                    {templateTheme.name}
                  </p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Template draft</p>
                  <h2 className="mt-2 font-serif text-2xl font-bold leading-snug tracking-tight text-slate-900 sm:text-[1.65rem]">
                    Open your resume in the studio
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
                    Live preview and autosave to this project — same editor flow as when you pick a layout from
                    templates, tuned for your content.
                  </p>
                  <span
                    className={cn(
                      buttonVariants({ size: "default" }),
                      "mt-6 inline-flex h-11 items-center justify-center rounded-full border-0 bg-[#0f766e] px-6 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(15,118,110,0.35)] transition-[background-color,box-shadow,transform] duration-200",
                      "group-hover/draft:bg-[#0d6660] group-hover/draft:shadow-[0_6px_18px_rgba(15,118,110,0.4)]",
                    )}
                  >
                    Edit this draft
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </PageContainer>
    </section>
  );
}

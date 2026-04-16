import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Eye, NotebookPen } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { ProjectDetailActions } from "@/components/projects/project-detail-actions";
import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
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
    description: "Edit and preview your resume project.",
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

  return (
    <section className="py-6 sm:py-10">
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

          <div className="flex flex-col gap-6 border-b border-border/70 pb-8 lg:flex-row lg:items-start lg:justify-between">
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

          <div className="grid gap-4 md:grid-cols-2">
            <Link
              href={ROUTES.app.projectBuild(projectId)}
              className="group/card relative overflow-hidden rounded-2xl border border-border/70 bg-card p-6 shadow-soft transition-all hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-elevated sm:p-7"
            >
              <div
                className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand/8 blur-3xl transition-opacity group-hover/card:opacity-100"
                aria-hidden
              />
              <div className="relative flex items-start gap-4">
                <span
                  className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-muted text-brand ring-1 ring-brand/15"
                  aria-hidden
                >
                  <NotebookPen className="size-5" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-subhead text-foreground">Resume builder</h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    Guided wizard for each section. Autosaves as you edit.
                  </p>
                  <span
                    className={cn(
                      buttonVariants({ size: "sm", variant: "outline" }),
                      "mt-5 group-hover/card:border-brand/40 group-hover/card:text-brand",
                    )}
                  >
                    Open builder →
                  </span>
                </div>
              </div>
            </Link>
            <Link
              href={ROUTES.app.projectPreview(projectId)}
              className="group/card relative overflow-hidden rounded-2xl border border-border/70 bg-card p-6 shadow-soft transition-all hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-elevated sm:p-7"
            >
              <div
                className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-info/10 blur-3xl"
                aria-hidden
              />
              <div className="relative flex items-start gap-4">
                <span
                  className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-info/10 text-info ring-1 ring-info/20"
                  aria-hidden
                >
                  <Eye className="size-5" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-subhead text-foreground">Preview &amp; templates</h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    Pick a template and see exactly how your resume reads before export.
                  </p>
                  <span
                    className={cn(
                      buttonVariants({ size: "sm", variant: "outline" }),
                      "mt-5 group-hover/card:border-brand/40 group-hover/card:text-brand",
                    )}
                  >
                    Open preview →
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

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

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
              className="inline-flex min-h-11 items-center text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline sm:min-h-0"
            >
              ← All resumes
            </Link>
          </div>

          <div className="flex flex-col gap-6 border-b border-border/80 pb-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 space-y-3">
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

          <div className="rounded-xl border border-border/80 bg-muted/20 p-6 ring-1 ring-foreground/5 sm:p-8">
            <h2 className="text-subhead text-foreground">Resume & preview</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Edit your content in the builder — it saves as you go. Open preview to pick a
              professional template and see exactly how your resume reads.
            </p>
            <div className="mt-6 flex flex-col gap-3 min-[400px]:flex-row min-[400px]:flex-wrap">
              <Link
                href={ROUTES.app.projectPreview(projectId)}
                className={cn(
                  buttonVariants({ size: "touch" }),
                  "inline-flex w-full justify-center min-[400px]:w-auto",
                )}
              >
                Preview & templates
              </Link>
              <Link
                href={ROUTES.app.projectBuild(projectId)}
                className={cn(
                  buttonVariants({ variant: "outline", size: "touch" }),
                  "inline-flex w-full justify-center min-[400px]:w-auto",
                )}
              >
                Open resume builder
              </Link>
            </div>
          </div>
        </div>
      </PageContainer>
    </section>
  );
}

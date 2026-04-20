import Link from "next/link";
import { FileText, Sparkles } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { DashboardQuickCreate } from "@/components/projects/dashboard-quick-create";
import { DashboardStats } from "@/components/projects/dashboard-stats";
import { ProjectsList } from "@/components/projects/projects-list";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import { requireUser } from "@/lib/auth/guards";
import { getDashboardProjects } from "@/services/projects/queries";

export const dynamic = "force-dynamic";

export default async function AppHomePage() {
  const { user } = await requireUser();
  const projects = await getDashboardProjects(user.id);

  const firstName =
    user.user_metadata?.full_name?.split?.(" ")?.[0] ??
    user.email?.split("@")[0] ??
    "there";

  const hasProjects = projects.length > 0;

  return (
    <section className="py-5 sm:py-8">
      <PageContainer>
        <div className="space-y-5 sm:space-y-6">
          <header className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-eyebrow">
                <Sparkles className="size-3.5" aria-hidden />
                Welcome back, {firstName}
              </p>
              <h1 className="mt-1 text-headline text-foreground">
                Your resumes
              </h1>
              <p className="text-sm text-muted-foreground">
                Private until you export. Preview stays in sync with PDF.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={ROUTES.templates}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "text-muted-foreground",
                )}
              >
                Browse templates
              </Link>
              <Link
                href={ROUTES.pricing}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                )}
              >
                Pricing
              </Link>
            </div>
          </header>

          <DashboardStats projects={projects} />

          <div className="rounded-2xl border border-border/70 bg-card px-4 py-4 shadow-soft sm:px-5">
            <DashboardQuickCreate />
          </div>

          {!hasProjects ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-muted/20 px-6 py-10 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-brand-muted ring-1 ring-brand/15">
                <FileText className="size-5 text-brand" aria-hidden />
              </div>
              <h2 className="mt-4 text-subhead text-foreground">
                No resumes yet
              </h2>
              <p className="mt-1 max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">
                Create your first resume above. You can duplicate it later for
                different job targets — each keeps its own version history.
              </p>
            </div>
          ) : (
            <ProjectsList projects={projects} />
          )}
        </div>
      </PageContainer>
    </section>
  );
}

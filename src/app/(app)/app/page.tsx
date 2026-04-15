import Link from "next/link";
import { FileText } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { CreateProjectForm } from "@/components/projects/create-project-form";
import { ProjectCard } from "@/components/projects/project-card";
import { SectionHeader } from "@/components/ui/section-header";
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

  return (
    <section className="py-6 sm:py-10">
      <PageContainer>
        <div className="space-y-10">
          <header className="space-y-2">
            <p className="text-sm text-muted-foreground">Welcome back, {firstName}</p>
            <SectionHeader
              level="page"
              title="Your resumes"
              description="Create a project for each role or target. Everything stays private until you export."
            />
          </header>

          <div className="rounded-xl border border-border/80 bg-card p-4 ring-1 ring-foreground/5 sm:p-6">
            <h2 className="text-subhead text-foreground">New resume</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Give it a clear name — you can rename anytime.
            </p>
            <div className="mt-4">
              <CreateProjectForm />
            </div>
          </div>

          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                <FileText className="size-7 text-muted-foreground" aria-hidden />
              </div>
              <h2 className="mt-6 text-headline text-foreground">No resumes yet</h2>
              <p className="mt-2 max-w-md text-pretty text-sm text-muted-foreground">
                Start with one project. You can duplicate it later for different job targets — each
                keeps its own version history.
              </p>
              <p className="mt-6 text-xs text-muted-foreground">
                Use the form above to create your first resume.
              </p>
            </div>
          ) : (
            <div>
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-headline text-foreground">All projects</h2>
                  <p className="text-sm text-muted-foreground">
                    {projects.length} saved resume{projects.length === 1 ? "" : "s"}
                  </p>
                </div>
                <Link
                  href={ROUTES.pricing}
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "self-start sm:self-auto",
                  )}
                >
                  View pricing
                </Link>
              </div>
              <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {projects.map((p) => (
                  <li key={p.id}>
                    <ProjectCard project={p} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </PageContainer>
    </section>
  );
}

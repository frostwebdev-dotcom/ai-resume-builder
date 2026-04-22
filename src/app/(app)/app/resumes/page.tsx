import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { DashboardQuickCreate } from "@/components/projects/dashboard-quick-create";
import { ProjectsList } from "@/components/projects/projects-list";
import { ROUTES } from "@/lib/constants";
import { requireUser } from "@/lib/auth/guards";
import { getDashboardProjects } from "@/services/projects/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Resumes",
  description: "Your resume projects: create, search, and open a project to edit in the studio.",
};

export default async function AppResumesPage() {
  const { user } = await requireUser({ nextPath: ROUTES.app.resumes });
  const projects = await getDashboardProjects(user.id);

  return (
    <section className="min-h-0 flex-1 bg-slate-100 py-6 sm:py-8">
      <PageContainer>
        <div className="space-y-6">
          <div>
            <Link
              href={ROUTES.app.root}
              className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline"
            >
              <ArrowLeft className="size-4" aria-hidden />
              Dashboard
            </Link>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Resumes</h1>
            <p className="mt-1 text-sm text-slate-600">
              Each project is one resume. Open a project for details, or Draft for the full-screen studio editor.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <DashboardQuickCreate />
          </div>

          <ProjectsList projects={projects} />
        </div>
      </PageContainer>
    </section>
  );
}

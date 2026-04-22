import type { Metadata } from "next";

import { DashboardCvWizardGrid } from "@/components/projects/dashboard-cv-wizard-grid";
import { requireUser } from "@/lib/auth/guards";
import { getDashboardProjects } from "@/services/projects/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Workspace overview: resumes, cover letters, jobs, and applications. Open Resumes to manage saved projects and the studio editor.",
};

export default async function AppHomePage() {
  const { user } = await requireUser();
  const projects = await getDashboardProjects(user.id);

  const firstName =
    user.user_metadata?.full_name?.split?.(" ")?.[0] ??
    user.email?.split("@")[0] ??
    "there";

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-100">
      <div className="border-b border-slate-200/80 bg-slate-100 px-4 py-4 sm:px-6 sm:py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Dashboard</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Welcome back, {firstName}
        </h1>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-4 sm:px-6 sm:py-5">
        <DashboardCvWizardGrid projects={projects} />
      </div>
    </section>
  );
}

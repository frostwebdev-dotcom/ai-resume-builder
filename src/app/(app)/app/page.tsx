import type { Metadata } from "next";
import Link from "next/link";

import { DashboardWorkspaceGrid } from "@/components/projects/dashboard-workspace-grid";
import { getOptionalAuth } from "@/lib/auth/guards";
import { ROUTES } from "@/lib/constants";
import { getDashboardProjects } from "@/services/projects/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Workspace overview: resumes, cover letters, jobs, and applications. Open Resumes to manage saved projects and the studio editor.",
};

export default async function AppHomePage() {
  const ctx = await getOptionalAuth();
  const projects = ctx ? await getDashboardProjects(ctx.user.id) : [];

  const firstName = ctx
    ? (ctx.user.user_metadata?.full_name?.split?.(" ")?.[0] ??
        ctx.user.email?.split("@")[0] ??
        "there")
    : "there";

  const welcomeTitle = ctx ? `Welcome back, ${firstName}` : "Welcome";

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-100">
      <div className="border-b border-slate-200/80 bg-slate-100 px-4 py-4 sm:px-6 sm:py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Dashboard</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          {welcomeTitle}
        </h1>
        {!ctx ? (
          <p className="mt-2 max-w-xl text-sm text-slate-600">
            You&apos;re browsing as a guest. Sign in to save projects and sync your resume. Your draft on{" "}
            <Link className="font-medium text-brand underline-offset-2 hover:underline" href={ROUTES.create}>
              Create
            </Link>{" "}
            stays in this browser until you sign in.
          </p>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-4 sm:px-6 sm:py-5">
        <DashboardWorkspaceGrid projects={projects} />
      </div>
    </section>
  );
}

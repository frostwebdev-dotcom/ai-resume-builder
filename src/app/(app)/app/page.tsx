import type { Metadata } from "next";

import { pageGutterXClass } from "@/components/layout/page-container";
import { DashboardHome } from "@/components/projects/dashboard-home";
import { cn } from "@/lib/utils";
import { getOptionalAuth } from "@/lib/auth/guards";
import { getDashboardProjects } from "@/services/projects/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Workspace overview: resumes, templates, jobs, and applications. Open Resumes to manage saved projects and the studio editor.",
};

export default async function AppHomePage() {
  const ctx = await getOptionalAuth();
  const projects = ctx ? await getDashboardProjects(ctx.user.id) : [];

  const firstName = ctx
    ? (ctx.user.user_metadata?.full_name?.split?.(" ")?.[0] ??
        ctx.user.email?.split("@")[0] ??
        "there")
    : "there";

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-slate-100">
      <div
        className={cn(
          "min-h-0 flex-1 basis-0 overflow-y-auto overflow-x-hidden overscroll-y-auto pb-10 pt-6 sm:pb-12 sm:pt-8",
          pageGutterXClass,
        )}
      >
        <DashboardHome projects={projects} firstName={firstName} isGuest={!ctx} />
      </div>
    </section>
  );
}

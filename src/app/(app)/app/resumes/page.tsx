import type { Metadata } from "next";

import { ResumesPageGallery } from "@/components/projects/resumes-page-gallery";
import { getOptionalAuth } from "@/lib/auth/guards";
import { getDashboardProjects } from "@/services/projects/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Resumes",
  description: "Your resume projects: create, search, and open a project to edit in the studio.",
};

export default async function AppResumesPage() {
  const ctx = await getOptionalAuth();
  const projects = ctx ? await getDashboardProjects(ctx.user.id) : [];

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-slate-50">
      <div className="min-h-0 flex-1 basis-0 overflow-y-auto overflow-x-hidden overscroll-y-auto pb-10 pt-0 sm:pb-12">
        <ResumesPageGallery projects={projects} guest={!ctx} />
      </div>
    </section>
  );
}

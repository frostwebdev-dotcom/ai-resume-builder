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
    <section className="min-h-0 flex-1 bg-slate-50 py-0 sm:bg-slate-50">
      <ResumesPageGallery projects={projects} guest={!ctx} />
    </section>
  );
}

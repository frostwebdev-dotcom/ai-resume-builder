import type { Metadata } from "next";
import { Briefcase } from "lucide-react";

import { AppWorkspacePlaceholder } from "@/components/layout/app-workspace-placeholder";
import { ROUTES } from "@/lib/constants";
import { requireUser } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Jobs",
  description: "Saved job postings (coming soon).",
};

export default async function JobsPage() {
  await requireUser({ nextPath: ROUTES.app.jobs });

  return (
    <AppWorkspacePlaceholder
      title="Jobs"
      description="Save roles you’re targeting, paste postings, and keep notes alongside your resume work. This area is not wired up yet — check back soon."
      icon={Briefcase}
    />
  );
}

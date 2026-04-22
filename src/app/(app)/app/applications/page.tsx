import type { Metadata } from "next";
import { ClipboardList } from "lucide-react";

import { AppWorkspacePlaceholder } from "@/components/layout/app-workspace-placeholder";
import { ROUTES } from "@/lib/constants";
import { requireUser } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Applications",
  description: "Application tracking (coming soon).",
};

export default async function ApplicationsPage() {
  await requireUser({ nextPath: ROUTES.app.applications });

  return (
    <AppWorkspacePlaceholder
      title="Applications"
      description="Track where you applied, deadlines, and outcomes. We’re building this next — your resumes stay under the Resumes tab."
      icon={ClipboardList}
    />
  );
}

import type { Metadata } from "next";
import { Mail } from "lucide-react";

import { AppWorkspacePlaceholder } from "@/components/layout/app-workspace-placeholder";
import { ROUTES } from "@/lib/constants";
import { requireUser } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cover Letters",
  description: "Cover letter workspace (coming soon).",
};

export default async function CoverLettersPage() {
  await requireUser({ nextPath: ROUTES.app.coverLetters });

  return (
    <AppWorkspacePlaceholder
      title="Cover letters"
      description="We’ll add cover-letter drafts and versioning here in a future release. For now, focus on your resumes from the Dashboard or Resumes tab."
      icon={Mail}
    />
  );
}

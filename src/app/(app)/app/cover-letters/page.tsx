import type { Metadata } from "next";
import Link from "next/link";
import { Mail } from "lucide-react";

import { AppWorkspacePlaceholder } from "@/components/layout/app-workspace-placeholder";
import { GuestAppRouteBanner } from "@/components/layout/guest-app-route-banner";
import { getOptionalAuth } from "@/lib/auth/guards";
import { ROUTES } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cover Letters",
  description: "Cover letter workspace (coming soon).",
};

export default async function CoverLettersPage() {
  const ctx = await getOptionalAuth();

  return (
    <AppWorkspacePlaceholder
      header={
        !ctx ? (
          <GuestAppRouteBanner nextPath={ROUTES.app.coverLetters}>
            You&apos;re browsing as a guest. Cover letter drafts will sync here after you sign in. For now, work on
            resumes from the{" "}
            <Link className="font-medium text-[#2268d7] underline-offset-2 hover:underline" href={ROUTES.app.root}>
              Dashboard
            </Link>{" "}
            or{" "}
            <Link className="font-medium text-[#2268d7] underline-offset-2 hover:underline" href={ROUTES.app.resumes}>
              Resumes
            </Link>{" "}
            tab.
          </GuestAppRouteBanner>
        ) : null
      }
      title="Cover letters"
      description="We’ll add cover-letter drafts and versioning here in a future release. For now, focus on your resumes from the Dashboard or Resumes tab."
      icon={Mail}
    />
  );
}

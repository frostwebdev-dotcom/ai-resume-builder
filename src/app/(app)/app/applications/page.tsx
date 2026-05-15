import type { Metadata } from "next";

import { WorkspaceFeatureComingSoon } from "@/components/workspace/workspace-feature-coming-soon";
import { APP_NAME } from "@/lib/constants";
import { getOptionalAuth } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Applications",
  description: `Application tracking in ${APP_NAME} is not available yet — use resumes for drafts and PDF export.`,
};

export default async function ApplicationsPage() {
  const ctx = await getOptionalAuth();

  return <WorkspaceFeatureComingSoon feature="applications" guest={!ctx} />;
}

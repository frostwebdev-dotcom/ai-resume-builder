import type { Metadata } from "next";

import { WorkspaceFeatureComingSoon } from "@/components/workspace/workspace-feature-coming-soon";
import { APP_NAME } from "@/lib/constants";
import { getOptionalAuth } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Jobs",
  description: `Job search in ${APP_NAME} is not available yet — resume editing and PDF export are the current focus.`,
};

export default async function JobsPage() {
  const ctx = await getOptionalAuth();

  return <WorkspaceFeatureComingSoon feature="jobs" guest={!ctx} />;
}

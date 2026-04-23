import type { Metadata } from "next";

import { ApplicationsBoard } from "@/components/applications/applications-board";
import { getOptionalAuth } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Applications",
  description: "Track applications, statuses, and next steps alongside your resume work.",
};

export default async function ApplicationsPage() {
  const ctx = await getOptionalAuth();

  return <ApplicationsBoard guest={!ctx} />;
}

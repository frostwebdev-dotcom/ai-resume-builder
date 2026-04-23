import type { Metadata } from "next";

import { JobsBoard } from "@/components/jobs/jobs-board";
import { getOptionalAuth } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Jobs",
  description: "Search roles, filter by location, and review listings alongside your resume work.",
};

export default async function JobsPage() {
  const ctx = await getOptionalAuth();

  return <JobsBoard guest={!ctx} />;
}

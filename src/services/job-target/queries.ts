import "server-only";

import type { JobTargetClientView } from "@/lib/job-target/client-types";
import { parseTailoringCompare } from "@/lib/job-target/parse";
import type { TailoringCompareV1 } from "@/lib/job-target/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { JobTarget } from "@/types/database";

export type JobTargetWithCompare = JobTarget & {
  tailoringCompare: TailoringCompareV1 | null;
};

export async function fetchJobTargetForProject(
  userId: string,
  projectId: string,
): Promise<JobTargetWithCompare | null> {
  const supabase = await createSupabaseServerClient();
  const { data: project } = await supabase
    .from("resume_projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!project) return null;

  const { data: row } = await supabase
    .from("job_targets")
    .select("*")
    .eq("project_id", projectId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!row) return null;

  const meta = row.metadata as Record<string, unknown> | null;
  const tailoringCompare = parseTailoringCompare(meta?.tailoring_compare);

  return {
    ...row,
    tailoringCompare,
  };
}

export function toJobTargetClientView(row: JobTargetWithCompare | null): JobTargetClientView | null {
  if (!row) return null;
  return {
    title: row.title,
    company: row.company,
    jobDescription: row.job_description,
    tailoringCompare: row.tailoringCompare,
  };
}

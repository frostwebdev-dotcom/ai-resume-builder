import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCompletedOrderForProject } from "@/services/downloads/entitlement";

export type ResumeDownloadAccess = {
  /** Server-verified: user has a completed order for this project */
  canDownload: boolean;
  /** Whether at least one download has been logged (informational) */
  hasDownloadHistory: boolean;
};

export async function getResumeDownloadAccess(
  userId: string,
  projectId: string,
): Promise<ResumeDownloadAccess> {
  const supabase = await createSupabaseServerClient();

  const order = await getCompletedOrderForProject(supabase, userId, projectId);

  const { count } = await supabase
    .from("downloads")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("project_id", projectId);

  return {
    canDownload: Boolean(order),
    hasDownloadHistory: (count ?? 0) > 0,
  };
}

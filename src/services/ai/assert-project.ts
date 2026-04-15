import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function assertResumeProjectOwned(
  userId: string,
  projectId: string,
): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("resume_projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();
  return Boolean(data);
}

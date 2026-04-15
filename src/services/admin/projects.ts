import "server-only";

import { escapeIlikePattern } from "@/lib/admin/search-params";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import type { ResumeProject } from "@/types/database";

export type AdminProjectRow = {
  project: ResumeProject;
  ownerDisplayName: string | null;
};

export async function getAdminProjectsList(params: {
  page: number;
  pageSize: number;
  q?: string;
  status?: ResumeProject["status"];
}): Promise<{ rows: AdminProjectRow[]; total: number }> {
  const service = createSupabaseServiceRoleClient();
  const from = (params.page - 1) * params.pageSize;
  const to = from + params.pageSize - 1;

  let query = service
    .from("resume_projects")
    .select("*", { count: "exact" })
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (params.status) {
    query = query.eq("status", params.status);
  }

  if (params.q) {
    const safe = escapeIlikePattern(params.q);
    query = query.or(`title.ilike.%${safe}%,slug.ilike.%${safe}%,id::text.ilike.%${safe}%`);
  }

  const { data: projects, error, count } = await query.range(from, to);

  if (error) {
    console.error("[admin] projects list", error);
    return { rows: [], total: 0 };
  }

  const list = (projects ?? []) as ResumeProject[];
  const userIds = [...new Set(list.map((p) => p.user_id))];
  const { data: owners } = await service.from("profiles").select("id, display_name").in("id", userIds);

  const ownerMap = new Map((owners ?? []).map((o) => [o.id, o.display_name]));

  const rows: AdminProjectRow[] = list.map((project) => ({
    project,
    ownerDisplayName: ownerMap.get(project.user_id) ?? null,
  }));

  return { rows, total: count ?? 0 };
}

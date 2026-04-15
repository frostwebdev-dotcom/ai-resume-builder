import "server-only";

import { escapeIlikePattern } from "@/lib/admin/search-params";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import type { Download } from "@/types/database";

export type AdminDownloadRow = {
  download: Download;
  userDisplayName: string | null;
  projectTitle: string | null;
};

export async function getAdminDownloadsList(params: {
  page: number;
  pageSize: number;
  q?: string;
}): Promise<{ rows: AdminDownloadRow[]; total: number }> {
  const service = createSupabaseServiceRoleClient();
  const from = (params.page - 1) * params.pageSize;
  const to = from + params.pageSize - 1;

  let query = service.from("downloads").select("*", { count: "exact" }).order("created_at", { ascending: false });

  if (params.q) {
    const safe = escapeIlikePattern(params.q);
    query = query.or(
      `file_name.ilike.%${safe}%,storage_path.ilike.%${safe}%,mime_type.ilike.%${safe}%,id::text.ilike.%${safe}%,user_id::text.ilike.%${safe}%,project_id::text.ilike.%${safe}%`,
    );
  }

  const { data: downloads, error, count } = await query.range(from, to);

  if (error) {
    console.error("[admin] downloads list", error);
    return { rows: [], total: 0 };
  }

  const list = (downloads ?? []) as Download[];
  const userIds = [...new Set(list.map((d) => d.user_id))];
  const projectIds = [...new Set(list.map((d) => d.project_id))];

  const projectsFetch =
    projectIds.length > 0
      ? service.from("resume_projects").select("id, title").in("id", projectIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] | null, error: null });

  const [{ data: profiles }, projectsResult] = await Promise.all([
    service.from("profiles").select("id, display_name").in("id", userIds),
    projectsFetch,
  ]);

  const projects = projectsResult.data;

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.display_name]));
  const projectMap = new Map((projects ?? ([] as { id: string; title: string }[])).map((p) => [p.id, p.title]));

  const rows: AdminDownloadRow[] = list.map((download) => ({
    download,
    userDisplayName: profileMap.get(download.user_id) ?? null,
    projectTitle: projectMap.get(download.project_id) ?? null,
  }));

  return { rows, total: count ?? 0 };
}

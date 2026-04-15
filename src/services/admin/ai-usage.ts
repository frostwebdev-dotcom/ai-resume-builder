import "server-only";

import { escapeIlikePattern } from "@/lib/admin/search-params";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import type { AiGenerationLog } from "@/types/database";

export type AdminAiLogRow = {
  log: AiGenerationLog;
  userDisplayName: string | null;
};

export async function getAdminAiUsageList(params: {
  page: number;
  pageSize: number;
  q?: string;
  ok: "all" | "ok" | "error";
}): Promise<{ rows: AdminAiLogRow[]; total: number }> {
  const service = createSupabaseServiceRoleClient();
  const from = (params.page - 1) * params.pageSize;
  const to = from + params.pageSize - 1;

  let query = service.from("ai_generation_logs").select("*", { count: "exact" }).order("created_at", {
    ascending: false,
  });

  if (params.ok === "ok") query = query.eq("ok", true);
  if (params.ok === "error") query = query.eq("ok", false);

  if (params.q) {
    const safe = escapeIlikePattern(params.q);
    query = query.or(
      `model.ilike.%${safe}%,error_code.ilike.%${safe}%,provider.ilike.%${safe}%,id::text.ilike.%${safe}%,user_id::text.ilike.%${safe}%`,
    );
  }

  const { data: logs, error, count } = await query.range(from, to);

  if (error) {
    console.error("[admin] ai logs list", error);
    return { rows: [], total: 0 };
  }

  const list = (logs ?? []) as AiGenerationLog[];
  const userIds = [...new Set(list.map((l) => l.user_id))];
  const { data: profiles } = await service.from("profiles").select("id, display_name").in("id", userIds);
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.display_name]));

  const rows: AdminAiLogRow[] = list.map((log) => ({
    log,
    userDisplayName: profileMap.get(log.user_id) ?? null,
  }));

  return { rows, total: count ?? 0 };
}

import "server-only";

import { escapeIlikePattern } from "@/lib/admin/search-params";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import type { AdminAuditLog } from "@/types/database";

export type AdminAuditRow = {
  log: AdminAuditLog;
  actorDisplayName: string | null;
};

export async function getAdminAuditList(params: {
  page: number;
  pageSize: number;
  q?: string;
}): Promise<{ rows: AdminAuditRow[]; total: number }> {
  const service = createSupabaseServiceRoleClient();
  const from = (params.page - 1) * params.pageSize;
  const to = from + params.pageSize - 1;

  let query = service.from("admin_audit_logs").select("*", { count: "exact" }).order("created_at", {
    ascending: false,
  });

  if (params.q) {
    const safe = escapeIlikePattern(params.q);
    query = query.or(
      `action.ilike.%${safe}%,resource_type.ilike.%${safe}%,id::text.ilike.%${safe}%,resource_id::text.ilike.%${safe}%,actor_id::text.ilike.%${safe}%`,
    );
  }

  const { data: logs, error, count } = await query.range(from, to);

  if (error) {
    console.error("[admin] audit list", error);
    return { rows: [], total: 0 };
  }

  const list = (logs ?? []) as AdminAuditLog[];
  const actorIds = [...new Set(list.map((l) => l.actor_id).filter(Boolean))] as string[];

  const { data: actors } = actorIds.length
    ? await service.from("profiles").select("id, display_name").in("id", actorIds)
    : { data: [] as { id: string; display_name: string | null }[] };

  const actorMap = new Map((actors ?? []).map((a) => [a.id, a.display_name]));

  const rows: AdminAuditRow[] = list.map((log) => ({
    log,
    actorDisplayName: log.actor_id ? (actorMap.get(log.actor_id) ?? null) : null,
  }));

  return { rows, total: count ?? 0 };
}

import "server-only";

import { escapeIlikePattern } from "@/lib/admin/search-params";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import type { Profile } from "@/types/database";

export type AdminUserRow = {
  profile: Profile;
  email: string | null;
};

export async function getAdminUsersList(params: {
  page: number;
  pageSize: number;
  q?: string;
}): Promise<{ rows: AdminUserRow[]; total: number }> {
  const service = createSupabaseServiceRoleClient();
  const from = (params.page - 1) * params.pageSize;
  const to = from + params.pageSize - 1;

  let query = service.from("profiles").select("*", { count: "exact" }).order("created_at", { ascending: false });

  if (params.q) {
    const safe = escapeIlikePattern(params.q);
    query = query.or(`display_name.ilike.%${safe}%,id::text.ilike.%${safe}%`);
  }

  const { data: profiles, error, count } = await query.range(from, to);

  if (error) {
    console.error("[admin] users list", error);
    return { rows: [], total: 0 };
  }

  const list = (profiles ?? []) as Profile[];
  const emails = await Promise.all(
    list.map(async (p) => {
      const { data, error: uerr } = await service.auth.admin.getUserById(p.id);
      if (uerr) return null;
      return data.user?.email ?? null;
    }),
  );

  const rows: AdminUserRow[] = list.map((profile, i) => ({
    profile,
    email: emails[i],
  }));

  return { rows, total: count ?? 0 };
}

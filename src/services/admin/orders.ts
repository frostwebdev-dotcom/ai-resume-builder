import "server-only";

import { escapeIlikePattern } from "@/lib/admin/search-params";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import type { Order, Payment } from "@/types/database";

export type AdminOrderRow = {
  order: Order;
  userDisplayName: string | null;
  payment: Payment | null;
};

export async function getAdminOrdersList(params: {
  page: number;
  pageSize: number;
  q?: string;
  status?: Order["status"];
}): Promise<{ rows: AdminOrderRow[]; total: number }> {
  const service = createSupabaseServiceRoleClient();
  const from = (params.page - 1) * params.pageSize;
  const to = from + params.pageSize - 1;

  let query = service.from("orders").select("*", { count: "exact" }).order("created_at", { ascending: false });

  if (params.status) {
    query = query.eq("status", params.status);
  }

  if (params.q) {
    const safe = escapeIlikePattern(params.q);
    query = query.or(`product_sku.ilike.%${safe}%,id::text.ilike.%${safe}%,user_id::text.ilike.%${safe}%`);
  }

  const { data: orders, error, count } = await query.range(from, to);

  if (error) {
    console.error("[admin] orders list", error);
    return { rows: [], total: 0 };
  }

  const list = (orders ?? []) as Order[];
  const orderIds = list.map((o) => o.id);
  const userIds = [...new Set(list.map((o) => o.user_id))];

  const paymentsFetch =
    orderIds.length > 0
      ? service.from("payments").select("*").in("order_id", orderIds)
      : Promise.resolve({ data: [] as Payment[] | null, error: null });

  const [{ data: profiles }, paymentsResult] = await Promise.all([
    service.from("profiles").select("id, display_name").in("id", userIds),
    paymentsFetch,
  ]);

  const payments = paymentsResult.data;

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.display_name]));
  const paymentByOrder = new Map<string, Payment>();
  for (const pay of payments ?? ([] as Payment[])) {
    paymentByOrder.set(pay.order_id, pay as Payment);
  }

  const rows: AdminOrderRow[] = list.map((order) => ({
    order,
    userDisplayName: profileMap.get(order.user_id) ?? null,
    payment: paymentByOrder.get(order.id) ?? null,
  }));

  return { rows, total: count ?? 0 };
}

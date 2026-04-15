import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CheckoutReturnState =
  | { kind: "missing_session" }
  | { kind: "not_found" }
  | { kind: "pending"; orderId: string; status: "pending" | "processing" }
  | { kind: "paid"; orderId: string }
  | { kind: "failed"; orderId: string };

/**
 * Resolves checkout return UI from DB only (never trusts query params for entitlement).
 */
export async function getCheckoutReturnState(
  userId: string,
  projectId: string,
  checkoutSessionId: string | undefined,
): Promise<CheckoutReturnState> {
  if (!checkoutSessionId?.trim()) {
    return { kind: "missing_session" };
  }

  const supabase = await createSupabaseServerClient();

  const { data: order, error } = await supabase
    .from("orders")
    .select("id, status, project_id")
    .eq("stripe_checkout_session_id", checkoutSessionId.trim())
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !order) {
    return { kind: "not_found" };
  }

  if (order.project_id !== projectId) {
    return { kind: "not_found" };
  }

  if (order.status === "completed") {
    return { kind: "paid", orderId: order.id };
  }

  if (order.status === "failed" || order.status === "refunded") {
    return { kind: "failed", orderId: order.id };
  }

  return {
    kind: "pending",
    orderId: order.id,
    status: order.status as "pending" | "processing",
  };
}

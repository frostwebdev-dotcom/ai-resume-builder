import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

/**
 * A completed order for this project grants PDF download entitlement.
 * SKU-specific rules can be added later (e.g. cover letter add-ons).
 */
export async function getCompletedOrderForProject(
  supabase: SupabaseClient<Database>,
  userId: string,
  projectId: string,
  /** When set, only this SKU counts toward entitlement (default: resume PDF unlock). */
  productSku = "resume_pdf_v1" as const,
): Promise<{ id: string } | null> {
  const { data, error } = await supabase
    .from("orders")
    .select("id")
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .eq("product_sku", productSku)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return { id: data.id };
}

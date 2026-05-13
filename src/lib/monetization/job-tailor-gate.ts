import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const PIPELINE_KIND = "job.tailor.pipeline";

/** Rolling window for free-tier job tailoring pipeline runs. */
const WINDOW_DAYS = 30;

function monthlyFreeCap(): number {
  const raw = process.env.JOB_TAILOR_MONTHLY_FREE_CAP;
  const n = raw ? Number.parseInt(raw, 10) : NaN;
  if (Number.isFinite(n) && n >= 0) return n;
  return 8;
}

/**
 * Count successful full job-tailoring pipeline runs in the rolling window.
 * Used for free-tier limits; each run logs one `ai_suggestions` row with kind {@link PIPELINE_KIND}.
 */
export async function countJobTailorPipelineRuns(userId: string): Promise<number> {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - WINDOW_DAYS);
  const supabase = await createSupabaseServerClient();
  const { count, error } = await supabase
    .from("ai_suggestions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("kind", PIPELINE_KIND)
    .gte("created_at", since.toISOString());

  if (error) return 0;
  return count ?? 0;
}

export type JobTailorGateResult =
  | { ok: true; used: number; cap: number; unlimited?: boolean }
  | { ok: false; code: "LIMIT"; error: string; used: number; cap: number };

/**
 * Free-tier gate for the full job-tailoring pipeline (review + section suggestions).
 *
 * Override for staff / staging: `JOB_TAILOR_UNLIMITED=1`
 * Cap: `JOB_TAILOR_MONTHLY_FREE_CAP` (default 8 per rolling 30 days).
 */
export async function assertJobTailoringPipelineAllowed(
  userId: string,
): Promise<JobTailorGateResult> {
  if (process.env.JOB_TAILOR_UNLIMITED === "1") {
    return { ok: true, used: 0, cap: monthlyFreeCap(), unlimited: true };
  }
  const cap = monthlyFreeCap();
  const used = await countJobTailorPipelineRuns(userId);
  if (used >= cap) {
    return {
      ok: false,
      code: "LIMIT",
      error: `You have used your free job tailoring runs for this period (${cap} every ${WINDOW_DAYS} days).`,
      used,
      cap,
    };
  }
  return { ok: true, used, cap };
}

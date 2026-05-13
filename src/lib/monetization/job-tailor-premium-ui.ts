/**
 * Client-safe premium UI hook (no `server-only`, no Supabase).
 * Server code continues to use {@link assertJobTailoringPipelineAllowed} in `job-tailor-gate.ts`.
 */

/**
 * Return true when the tailoring add-on is sold at checkout and the UI should show
 * upgrade CTAs. (Planned SKU: `tailored_job_pack_v1` — keep false until checkout is wired.)
 */
export function shouldOfferJobTailoringPremiumPack(): boolean {
  return false;
}

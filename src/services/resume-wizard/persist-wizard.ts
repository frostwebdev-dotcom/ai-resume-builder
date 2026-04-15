import "server-only";

import { hydrateWizardState } from "@/lib/resume-wizard/parse";
import { wizardStateSchema } from "@/lib/resume-wizard/schema";
import type { WizardStateV1 } from "@/lib/resume-wizard/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

export async function updateProjectWizardState(
  userId: string,
  projectId: string,
  mutator: (draft: WizardStateV1) => WizardStateV1,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createSupabaseServerClient();
  const { data: row, error: fetchErr } = await supabase
    .from("resume_projects")
    .select("metadata")
    .eq("id", projectId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (fetchErr || !row) {
    return { ok: false, error: "Project not found." };
  }

  const meta = row.metadata as Record<string, unknown> | null;
  const rawWizard = meta?.wizard;
  const draft = hydrateWizardState(rawWizard);
  const next = wizardStateSchema.parse(mutator(draft));

  const nextMeta = {
    ...(meta && typeof meta === "object" && !Array.isArray(meta) ? meta : {}),
    wizard: next as unknown as Json,
  };

  const { error: upErr } = await supabase
    .from("resume_projects")
    .update({ metadata: nextMeta as Json })
    .eq("id", projectId)
    .eq("user_id", userId);

  if (upErr) return { ok: false, error: upErr.message };
  return { ok: true };
}

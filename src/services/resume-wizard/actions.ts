"use server";

import { revalidatePath } from "next/cache";

import { hydrateWizardState } from "@/lib/resume-wizard/parse";
import { wizardStateSchema } from "@/lib/resume-wizard/schema";
import { ROUTES } from "@/lib/constants";
import { mapPostgrestAuthError } from "@/lib/supabase/map-postgrest-error";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

export type SaveWizardResult = { ok: true } | { ok: false; error: string };

async function getSessionUserId(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/**
 * Validates and persists the full wizard snapshot into `resume_projects.metadata.wizard`.
 */
export async function saveWizardDraftAction(
  projectId: string,
  state: unknown,
): Promise<SaveWizardResult> {
  const userId = await getSessionUserId();
  if (!userId) {
    return { ok: false, error: "You must be signed in to save." };
  }

  const parsed = wizardStateSchema.safeParse(state);
  if (!parsed.success) {
    return {
      ok: false,
      error:
        "Some fields could not be saved. Check links (use https://) or shorten long text.",
    };
  }

  const supabase = await createSupabaseServerClient();

  const { data: row, error: fetchErr } = await supabase
    .from("resume_projects")
    .select("metadata")
    .eq("id", projectId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (fetchErr) {
    return { ok: false, error: mapPostgrestAuthError(fetchErr) };
  }
  if (!row) {
    return { ok: false, error: "Could not load project." };
  }

  const base =
    row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
      ? (row.metadata as Record<string, unknown>)
      : {};

  const nextMetadata = {
    ...base,
    wizard: parsed.data as unknown as Json,
  };

  const { error: upErr } = await supabase
    .from("resume_projects")
    .update({ metadata: nextMetadata as Json })
    .eq("id", projectId)
    .eq("user_id", userId);

  if (upErr) {
    return { ok: false, error: mapPostgrestAuthError(upErr) };
  }

  revalidatePath(ROUTES.app.project(projectId));
  revalidatePath(ROUTES.app.projectBuild(projectId));
  revalidatePath(ROUTES.app.projectPreviewExport(projectId));
  return { ok: true };
}

/**
 * Read wizard JSON from project metadata (server-only helper for RSC).
 */
export async function fetchWizardStateForProject(
  userId: string,
  projectId: string,
) {
  const supabase = await createSupabaseServerClient();
  const { data: row, error } = await supabase
    .from("resume_projects")
    .select("metadata")
    .eq("id", projectId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !row) return null;

  const meta = row.metadata as Record<string, unknown> | null;
  const rawWizard = meta?.wizard;
  return hydrateWizardState(rawWizard);
}

"use server";

import { revalidatePath } from "next/cache";

import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { trackServerEvent } from "@/lib/analytics/server";
import { ROUTES } from "@/lib/constants";
import { enforcePdfDownloadLimit } from "@/lib/security/rate-limit-enforcement";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { generateResumePdfAndSignedUrl } from "@/services/downloads/resume-pdf-pipeline";
import { downloadProjectSchema } from "@/validation/downloads";

export type RequestDownloadResult =
  | { ok: true; signedUrl: string; expiresIn: number }
  | {
      ok: false;
      error: string;
      code: "AUTH" | "NOT_FOUND" | "PAYMENT_REQUIRED" | "GENERATION_FAILED" | "RATE_LIMIT";
    };

async function getSessionUserId(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/**
 * Generates the resume PDF on the server, stores it privately, logs `downloads`, returns a short-lived signed URL.
 * Entitlement is enforced server-side (completed order for project); the client only receives an opaque URL.
 */
export async function requestResumeDownloadAction(
  raw: unknown,
): Promise<RequestDownloadResult> {
  const parsed = downloadProjectSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Invalid project.", code: "NOT_FOUND" };
  }

  const userId = await getSessionUserId();
  if (!userId) {
    return { ok: false, error: "Sign in to download.", code: "AUTH" };
  }

  const rl = await enforcePdfDownloadLimit(userId);
  if (!rl.ok) {
    return { ok: false, error: rl.message, code: "RATE_LIMIT" };
  }

  const supabase = await createSupabaseServerClient();
  const { data: project, error } = await supabase
    .from("resume_projects")
    .select("id, title, template_id, user_id")
    .eq("id", parsed.data.projectId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !project) {
    return { ok: false, error: "Project not found.", code: "NOT_FOUND" };
  }

  const result = await generateResumePdfAndSignedUrl({
    userId,
    projectId: project.id,
    projectTitle: project.title,
    templateId: project.template_id,
  });

  if (!result.ok) {
    return {
      ok: false,
      error: result.message,
      code: result.code,
    };
  }

  trackServerEvent(ANALYTICS_EVENTS.PDF_DOWNLOADED, {
    project_id_prefix: project.id.slice(0, 8),
  });

  revalidatePath(ROUTES.app.project(project.id));
  revalidatePath(ROUTES.app.projectPreview(project.id));
  revalidatePath(ROUTES.app.root);

  return {
    ok: true,
    signedUrl: result.signedUrl,
    expiresIn: result.expiresIn,
  };
}

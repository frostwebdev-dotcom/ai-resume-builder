import "server-only";

import { randomUUID } from "node:crypto";

import { parseProjectMetadata } from "@/lib/projects/metadata";
import { mapWizardToPreviewDocument } from "@/lib/resume-preview/map-wizard-to-preview";
import { templateIdToSlug } from "@/lib/resume-preview/resolve-slug";
import { renderResumePdfBuffer } from "@/lib/resume-pdf/pdfkit/render-resume-pdf";
import {
  downloadAvatarBuffer,
  isAvatarPathOwnedBy,
} from "@/lib/supabase/avatar-storage";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { fetchWizardStateForProject } from "@/services/resume-wizard/actions";
import { getCompletedOrderForProject } from "@/services/downloads/entitlement";
import { trySendDownloadReadyEmail } from "@/services/email/download-ready";

const BUCKET = "resume-pdfs";
const SIGNED_URL_TTL_SEC = 60;
/** Stored file row retention hint for future storage GC / cron (not the signed URL TTL). */
const DOWNLOAD_RECORD_RETENTION_DAYS = 30;

function safePdfFileName(projectTitle: string): string {
  const base = projectTitle
    .trim()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 72);
  return `${base || "resume"}.pdf`;
}

export type PdfPipelineResult =
  | {
      ok: true;
      signedUrl: string;
      expiresIn: number;
      storagePath: string;
    }
  | { ok: false; code: "NOT_FOUND" | "PAYMENT_REQUIRED" | "GENERATION_FAILED"; message: string };

/**
 * Full server-side pipeline: entitlement → render PDF → private storage → signed URL → audit row.
 * Must only run after session user is verified and project ownership is confirmed by the caller.
 */
export async function generateResumePdfAndSignedUrl(params: {
  userId: string;
  projectId: string;
  projectTitle: string;
  templateId: string | null;
}): Promise<PdfPipelineResult> {
  const service = createSupabaseServiceRoleClient();

  const order = await getCompletedOrderForProject(service, params.userId, params.projectId);
  if (!order) {
    return {
      ok: false,
      code: "PAYMENT_REQUIRED",
      message: "Complete purchase to download your PDF.",
    };
  }

  const wizard = await fetchWizardStateForProject(params.userId, params.projectId);
  if (!wizard) {
    return { ok: false, code: "NOT_FOUND", message: "Resume not found." };
  }

  const { data: projectRow } = await service
    .from("resume_projects")
    .select("metadata")
    .eq("id", params.projectId)
    .eq("user_id", params.userId)
    .maybeSingle();

  const meta = projectRow ? parseProjectMetadata(projectRow.metadata) : { resume_style: undefined, avatar_path: null };
  const resumeStyle = meta.resume_style;
  const avatarPath = meta.avatar_path ?? null;

  let avatarBuffer: Buffer | null = null;
  if (avatarPath && isAvatarPathOwnedBy(avatarPath, params.userId, params.projectId)) {
    const downloaded = await downloadAvatarBuffer(service, avatarPath);
    if (downloaded) avatarBuffer = downloaded.buffer;
  }

  const doc = mapWizardToPreviewDocument(wizard);
  const slug = templateIdToSlug(params.templateId);

  let buffer: Buffer;
  try {
    buffer = await renderResumePdfBuffer(doc, slug, resumeStyle, avatarBuffer);
  } catch (e) {
    console.error("[resume-pdf]", e);
    return {
      ok: false,
      code: "GENERATION_FAILED",
      message: "Could not generate PDF. Try again shortly.",
    };
  }

  const objectId = randomUUID();
  const storagePath = `${params.userId}/${params.projectId}/${objectId}.pdf`;
  const fileName = safePdfFileName(params.projectTitle);

  const { error: upErr } = await service.storage.from(BUCKET).upload(storagePath, buffer, {
    contentType: "application/pdf",
    upsert: false,
  });

  if (upErr) {
    console.error("[resume-pdf] upload", upErr);
    return {
      ok: false,
      code: "GENERATION_FAILED",
      message: "Could not store PDF. Try again shortly.",
    };
  }

  const expiresAt = new Date(
    Date.now() + DOWNLOAD_RECORD_RETENTION_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { error: dlErr } = await service.from("downloads").insert({
    user_id: params.userId,
    project_id: params.projectId,
    order_id: order.id,
    storage_path: storagePath,
    file_name: fileName,
    mime_type: "application/pdf",
    bytes: buffer.length,
    expires_at: expiresAt,
  });

  if (dlErr) {
    console.error("[resume-pdf] downloads insert", dlErr);
    return {
      ok: false,
      code: "GENERATION_FAILED",
      message: "Could not finalize download. Try again.",
    };
  }

  void trySendDownloadReadyEmail({
    userId: params.userId,
    projectId: params.projectId,
    projectTitle: params.projectTitle,
    orderId: order.id,
  }).catch((e) => console.error("[resume-pdf] download-ready email", e));

  const { data: signed, error: signErr } = await service.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SEC);

  if (signErr || !signed?.signedUrl) {
    console.error("[resume-pdf] sign", signErr);
    return {
      ok: false,
      code: "GENERATION_FAILED",
      message: "Could not prepare download link. Try again.",
    };
  }

  return {
    ok: true,
    signedUrl: signed.signedUrl,
    expiresIn: SIGNED_URL_TTL_SEC,
    storagePath,
  };
}

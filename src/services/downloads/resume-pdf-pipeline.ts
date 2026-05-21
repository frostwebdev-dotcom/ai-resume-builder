import "server-only";

import { randomUUID } from "node:crypto";

import { parseProjectMetadata } from "@/lib/projects/metadata";
import { mapWizardToPreviewDocument } from "@/lib/resume-preview/map-wizard-to-preview";
import { templateIdToSlug } from "@/lib/resume-preview/resolve-slug";
import { renderResumePdfBuffer } from "@/lib/resume-pdf/pdfkit/render-resume-pdf";
import {
  describeResumeExportReadiness,
  isPlausiblePdfBuffer,
} from "@/lib/resume-pdf/validate-export-document";
import {
  downloadAvatarBuffer,
  isAvatarPathOwnedBy,
} from "@/lib/supabase/avatar-storage";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { fetchWizardStateForProject } from "@/services/resume-wizard/actions";
import { getCompletedOrderForProject } from "@/services/downloads/entitlement";
import { trySendDownloadReadyEmail } from "@/services/email/download-ready";
import { RESUME_PDF_SIGNED_URL_TTL_SEC } from "@/lib/downloads/resume-pdf-constants";

const BUCKET = "resume-pdfs";
/** Long enough for slow mobile networks; still short-lived (not a permanent public URL). */
const SIGNED_URL_TTL_SEC = RESUME_PDF_SIGNED_URL_TTL_SEC;
/** Stored file row retention hint for future storage GC / cron (not the signed URL TTL). */
const DOWNLOAD_RECORD_RETENTION_DAYS = 30;

function isDownloadsTableUnavailable(err: { code?: string; message?: string } | null): boolean {
  if (!err) return false;
  const code = err.code ?? "";
  const msg = (err.message ?? "").toLowerCase();
  return (
    code === "PGRST205" ||
    code === "42P01" ||
    (msg.includes("schema cache") && msg.includes("could not find")) ||
    (msg.includes("relation") && msg.includes("does not exist"))
  );
}

function safePdfFileName(projectTitle: string, requestedFileName?: string): string {
  const base = (requestedFileName?.trim() || projectTitle)
    .trim()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 72);
  return `${base || "resume"}.pdf`;
}

function requestedFileNameFromOrderMeta(meta: unknown): string | undefined {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return undefined;
  const value = (meta as Record<string, unknown>).requested_file_name;
  return typeof value === "string" && value.trim() ? value : undefined;
}

export type PdfPipelineResult =
  | {
      ok: true;
      signedUrl: string;
      expiresIn: number;
      storagePath: string;
    }
  | {
      ok: false;
      code: "NOT_FOUND" | "PAYMENT_REQUIRED" | "INSUFFICIENT_CONTENT" | "GENERATION_FAILED";
      message: string;
    };

/**
 * Full server-side pipeline: entitlement → render PDF → private storage → signed URL → audit row.
 * Must only run after session user is verified and project ownership is confirmed by the caller.
 */
export async function generateResumePdfAndSignedUrl(params: {
  userId: string;
  projectId: string;
  projectTitle: string;
  templateId: string | null;
  fileName?: string;
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
  const readiness = describeResumeExportReadiness(doc);
  if (!readiness.ok) {
    return { ok: false, code: "INSUFFICIENT_CONTENT", message: readiness.message };
  }

  const slug = templateIdToSlug(params.templateId);

  let buffer: Buffer;
  try {
    buffer = await renderResumePdfBuffer(doc, slug, resumeStyle, avatarBuffer);
  } catch (e) {
    console.error("[resume-pdf]", e);
    return {
      ok: false,
      code: "GENERATION_FAILED",
      message:
        "We could not build your PDF this time. Your resume content is saved—try again in a moment, or edit in Draft if something looks unusual.",
    };
  }

  if (!isPlausiblePdfBuffer(buffer)) {
    console.error("[resume-pdf] invalid pdf buffer", { bytes: buffer?.length });
    return {
      ok: false,
      code: "GENERATION_FAILED",
      message:
        "The generated file did not pass validation. Nothing was saved. Please try downloading again.",
    };
  }

  /** Opaque object key — do not encode user/project in the path (mapping lives in `downloads`). */
  const objectId = randomUUID();
  const storagePath = `v1/${objectId}.pdf`;
  const fileName = safePdfFileName(
    params.projectTitle,
    params.fileName ?? requestedFileNameFromOrderMeta(order.metadata),
  );

  const { error: upErr } = await service.storage.from(BUCKET).upload(storagePath, buffer, {
    contentType: "application/pdf",
    upsert: false,
  });

  if (upErr) {
    console.error("[resume-pdf] upload", upErr);
    return {
      ok: false,
      code: "GENERATION_FAILED",
      message:
        "Could not store your PDF securely. Please try again in a moment. If this keeps happening, contact support.",
    };
  }

  const expiresAt = new Date(
    Date.now() + DOWNLOAD_RECORD_RETENTION_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data: downloadRow, error: dlErr } = await service
    .from("downloads")
    .insert({
      user_id: params.userId,
      project_id: params.projectId,
      order_id: order.id,
      storage_path: storagePath,
      file_name: fileName,
      mime_type: "application/pdf",
      bytes: buffer.length,
      expires_at: expiresAt,
    })
    .select("id")
    .maybeSingle();

  if (dlErr) {
    if (isDownloadsTableUnavailable(dlErr)) {
      console.warn("[resume-pdf] downloads table unavailable; continuing without row", dlErr.code);
    } else {
      console.error("[resume-pdf] downloads insert", dlErr);
      const { error: rmUpErr } = await service.storage.from(BUCKET).remove([storagePath]);
      if (rmUpErr) console.warn("[resume-pdf] rollback upload after insert failure", rmUpErr);
      return {
        ok: false,
        code: "GENERATION_FAILED",
        message: "Could not record your download. Nothing was charged again—please try once more.",
      };
    }
  }

  void trySendDownloadReadyEmail({
    userId: params.userId,
    projectId: params.projectId,
    projectTitle: params.projectTitle,
    orderId: order.id,
  }).catch((e) => console.error("[resume-pdf] download-ready email", e));

  const { data: signed, error: signErr } = await service.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SEC, { download: fileName });

  if (signErr || !signed?.signedUrl) {
    console.error("[resume-pdf] sign", signErr);
    if (downloadRow?.id) {
      const { error: delDlErr } = await service.from("downloads").delete().eq("id", downloadRow.id);
      if (delDlErr) console.warn("[resume-pdf] rollback download row", delDlErr);
    }
    const { error: rmErr } = await service.storage.from(BUCKET).remove([storagePath]);
    if (rmErr) console.warn("[resume-pdf] rollback storage", rmErr);
    return {
      ok: false,
      code: "GENERATION_FAILED",
      message:
        "Could not create a secure download link. Please try again. If the link expired after you opened it, start a fresh download from this page.",
    };
  }

  return {
    ok: true,
    signedUrl: signed.signedUrl,
    expiresIn: SIGNED_URL_TTL_SEC,
    storagePath,
  };
}

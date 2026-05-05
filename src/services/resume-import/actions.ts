"use server";

import { getSessionUser } from "@/lib/auth/session";
import { getClientIp } from "@/lib/security/client-ip";
import { enforceResumeImportLimit } from "@/lib/security/rate-limit-enforcement";
import { buildResumeImportUserPrompt } from "@/lib/resume-import/build-import-user-prompt";
import { createDemoWizardStateForTemplate } from "@/lib/resume-wizard/demo-wizard-state";
import type { SupportedResumeMime } from "@/lib/resume-import/extract-document-text";
import { extractResumePlainText } from "@/lib/resume-import/extract-document-text";
import { mergeWizardFromImport } from "@/lib/resume-import/merge-wizard-from-import";
import { serverEnv } from "@/lib/env";
import { runStructuredGeneration } from "@/services/ai/generation-core";
import { AI_OPERATION_IDS } from "@/services/ai/prompts/registry";
import type { WizardStateV1 } from "@/lib/resume-wizard/types";
import {
  resumeImportAiOutputSchema,
  resumeImportUploadInputSchema,
} from "@/validation/resume-import";

export type ResumeImportFromFileResult =
  | { ok: true; wizard: WizardStateV1 }
  | { ok: false; error: string; code?: string };

const MIN_TEXT_LEN = 80;

function isSupportedMime(m: string): m is SupportedResumeMime {
  return (
    m === "application/pdf" ||
    m === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );
}

/**
 * Extracts text from a PDF or DOCX, runs structured AI parsing, and returns a full `WizardStateV1`
 * merged onto the template’s demo skeleton (valid layout + section order).
 *
 * Rate-limited per user id or client IP. Does not persist the file.
 */
export async function importResumeFromFileAction(raw: unknown): Promise<ResumeImportFromFileResult> {
  const parsed = resumeImportUploadInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Invalid upload payload.", code: "VALIDATION" };
  }

  const { templateSlug, fileName, mimeType, fileBase64 } = parsed.data;

  if (!serverEnv.OPENAI_API_KEY) {
    return {
      ok: false,
      error: "AI is not configured. Add OPENAI_API_KEY to enable résumé import.",
      code: "NO_AI",
    };
  }

  const user = await getSessionUser();
  const ip = await getClientIp();
  const rateKey = user ? `u:${user.id}` : `ip:${ip}`;
  const rl = await enforceResumeImportLimit(rateKey);
  if (!rl.ok) {
    return { ok: false, error: rl.message, code: "RATE_LIMIT" };
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(fileBase64, "base64");
  } catch {
    return { ok: false, error: "Could not read the uploaded file.", code: "INVALID_FILE" };
  }

  if (buffer.length < 64) {
    return { ok: false, error: "That file looks empty.", code: "EMPTY_FILE" };
  }

  if (!isSupportedMime(mimeType)) {
    return { ok: false, error: "Only PDF and Word (.docx) files are supported.", code: "UNSUPPORTED_TYPE" };
  }

  let plain: string;
  try {
    const extracted = await extractResumePlainText(buffer, mimeType);
    plain = extracted.text;
  } catch (e) {
    if (e instanceof Error && e.message === "FILE_TOO_LARGE") {
      return { ok: false, error: "File is too large (max 9 MB).", code: "TOO_LARGE" };
    }
    return {
      ok: false,
      error: "We could not read text from this file. Try a different PDF or export Word as .docx.",
      code: "EXTRACT_FAILED",
    };
  }

  if (plain.trim().length < MIN_TEXT_LEN) {
    return {
      ok: false,
      error: "Too little text was found in this file. Try a text-based PDF (not a scan) or a .docx export.",
      code: "WEAK_TEXT",
    };
  }

  const userMessage = buildResumeImportUserPrompt({ fileName, mimeType, plainText: plain });

  const gen = await runStructuredGeneration({
    operationId: AI_OPERATION_IDS.RESUME_IMPORT_PARSE,
    userId: user?.id ?? rateKey,
    projectId: null,
    userMessage,
    outputSchema: resumeImportAiOutputSchema,
    skipUsageCheck: true,
    skipLogging: !user,
  });

  if (!gen.ok) {
    return { ok: false, error: gen.error, code: gen.code };
  }

  try {
    const base = createDemoWizardStateForTemplate(templateSlug);
    const wizard = mergeWizardFromImport(base, gen.data);
    return { ok: true, wizard };
  } catch {
    return {
      ok: false,
      error: "Imported content could not be validated. Try again or use a simpler file.",
      code: "MERGE_FAILED",
    };
  }
}

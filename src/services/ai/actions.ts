"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { tryLogAiSuggestion } from "@/lib/ai/usage-logger";
import { ROUTES } from "@/lib/constants";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { assertResumeProjectOwned } from "@/services/ai/assert-project";
import * as ResumeAi from "@/services/ai/resume-ai";
import type { AiResult } from "@/types/ai";
import type { Json } from "@/types/database";
import {
  additionalTextInput,
  educationPolishInput,
  experienceBulletsInput,
  skillsTextInput,
  summaryGenerateInput,
  summaryImproveInput,
  summaryTailorInput,
  summaryTextOpInput,
} from "@/validation/ai";

export type { AiResult } from "@/types/ai";

async function getSessionUserId(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

function revalidateProject(projectId: string) {
  revalidatePath(ROUTES.app.projectBuild(projectId));
  revalidatePath(ROUTES.app.project(projectId));
}

export async function aiGenerateSummaryAction(
  raw: unknown,
): Promise<AiResult<{ headline: string; summary: string }>> {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false, error: "Sign-in required.", code: "AUTH" };
  const parsed = summaryGenerateInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Check your inputs and try again.", code: "VALIDATION" };
  }
  const out = await ResumeAi.aiGenerateSummary(userId, parsed.data);
  if (out.ok) revalidateProject(parsed.data.projectId);
  return out;
}

export async function aiTailorSummaryAction(
  raw: unknown,
): Promise<AiResult<{ headline: string; summary: string }>> {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false, error: "Sign-in required.", code: "AUTH" };
  const parsed = summaryTailorInput.safeParse(raw);
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors.targetRole?.[0];
    return {
      ok: false,
      error: msg ?? "Add a target role and try again.",
      code: "VALIDATION",
    };
  }
  const out = await ResumeAi.aiTailorSummary(userId, parsed.data);
  if (out.ok) revalidateProject(parsed.data.projectId);
  return out;
}

export async function aiShortenSummaryAction(
  raw: unknown,
): Promise<AiResult<{ headline: string; summary: string }>> {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false, error: "Sign-in required.", code: "AUTH" };
  const parsed = summaryTextOpInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Invalid summary fields.", code: "VALIDATION" };
  }
  const out = await ResumeAi.aiShortenSummary(userId, parsed.data);
  if (out.ok) revalidateProject(parsed.data.projectId);
  return out;
}

export async function aiExpandSummaryAction(
  raw: unknown,
): Promise<AiResult<{ headline: string; summary: string }>> {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false, error: "Sign-in required.", code: "AUTH" };
  const parsed = summaryTextOpInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Invalid summary fields.", code: "VALIDATION" };
  }
  const out = await ResumeAi.aiExpandSummary(userId, parsed.data);
  if (out.ok) revalidateProject(parsed.data.projectId);
  return out;
}

export async function aiGrammarSummaryAction(
  raw: unknown,
): Promise<AiResult<{ headline: string; summary: string }>> {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false, error: "Sign-in required.", code: "AUTH" };
  const parsed = summaryTextOpInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Invalid summary fields.", code: "VALIDATION" };
  }
  const out = await ResumeAi.aiGrammarSummary(userId, parsed.data);
  if (out.ok) revalidateProject(parsed.data.projectId);
  return out;
}

export async function aiImproveSummaryAction(
  raw: unknown,
): Promise<AiResult<{ headline: string; summary: string }>> {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false, error: "Sign-in required.", code: "AUTH" };
  const parsed = summaryImproveInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Invalid summary fields.", code: "VALIDATION" };
  }
  const out = await ResumeAi.aiImproveSummary(userId, parsed.data);
  if (out.ok) revalidateProject(parsed.data.projectId);
  return out;
}

export async function aiProfessionalSummaryAction(
  raw: unknown,
): Promise<AiResult<{ headline: string; summary: string }>> {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false, error: "Sign-in required.", code: "AUTH" };
  const parsed = summaryImproveInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Invalid summary fields.", code: "VALIDATION" };
  }
  const out = await ResumeAi.aiProfessionalSummary(userId, parsed.data);
  if (out.ok) revalidateProject(parsed.data.projectId);
  return out;
}

const logAiSuggestionInputSchema = z.object({
  projectId: z.string().uuid(),
  kind: z.string().min(1).max(120),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Best-effort analytics row in `ai_suggestions` (accepted / dismissed, etc.).
 */
export async function logAiSuggestionAction(
  raw: unknown,
): Promise<{ ok: true } | { ok: false; error: string; code?: string }> {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false, error: "Sign-in required.", code: "AUTH" };
  const parsed = logAiSuggestionInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Invalid payload.", code: "VALIDATION" };
  }
  const owned = await assertResumeProjectOwned(userId, parsed.data.projectId);
  if (!owned) return { ok: false, error: "Project not found.", code: "NOT_FOUND" };
  const metadata = { ...(parsed.data.metadata ?? {}), source: "resume_builder" } as Json;
  await tryLogAiSuggestion({
    userId,
    projectId: parsed.data.projectId,
    kind: parsed.data.kind,
    metadata,
  });
  return { ok: true };
}

export async function aiRewriteExperienceBulletsAction(
  raw: unknown,
): Promise<AiResult<{ bullets: string[] }>> {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false, error: "Sign-in required.", code: "AUTH" };
  const parsed = experienceBulletsInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Invalid experience fields.", code: "VALIDATION" };
  }
  const out = await ResumeAi.aiRewriteExperienceBullets(userId, parsed.data);
  if (out.ok) revalidateProject(parsed.data.projectId);
  return out;
}

export async function aiStrengthenExperienceBulletsAction(
  raw: unknown,
): Promise<AiResult<{ bullets: string[] }>> {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false, error: "Sign-in required.", code: "AUTH" };
  const parsed = experienceBulletsInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Invalid experience fields.", code: "VALIDATION" };
  }
  const out = await ResumeAi.aiStrengthenExperienceBullets(userId, parsed.data);
  if (out.ok) revalidateProject(parsed.data.projectId);
  return out;
}

export async function aiShortenExperienceBulletsAction(
  raw: unknown,
): Promise<AiResult<{ bullets: string[] }>> {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false, error: "Sign-in required.", code: "AUTH" };
  const parsed = experienceBulletsInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Invalid experience fields.", code: "VALIDATION" };
  }
  const out = await ResumeAi.aiShortenExperienceBullets(userId, parsed.data);
  if (out.ok) revalidateProject(parsed.data.projectId);
  return out;
}

export async function aiExpandExperienceBulletsAction(
  raw: unknown,
): Promise<AiResult<{ bullets: string[] }>> {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false, error: "Sign-in required.", code: "AUTH" };
  const parsed = experienceBulletsInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Invalid experience fields.", code: "VALIDATION" };
  }
  const out = await ResumeAi.aiExpandExperienceBullets(userId, parsed.data);
  if (out.ok) revalidateProject(parsed.data.projectId);
  return out;
}

export async function aiRephraseSkillsAction(
  raw: unknown,
): Promise<AiResult<{ lines: string }>> {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false, error: "Sign-in required.", code: "AUTH" };
  const parsed = skillsTextInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Invalid skills text.", code: "VALIDATION" };
  }
  const out = await ResumeAi.aiRephraseSkills(userId, parsed.data);
  if (out.ok) revalidateProject(parsed.data.projectId);
  return out;
}

export async function aiShortenSkillsAction(
  raw: unknown,
): Promise<AiResult<{ lines: string }>> {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false, error: "Sign-in required.", code: "AUTH" };
  const parsed = skillsTextInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Invalid skills text.", code: "VALIDATION" };
  }
  const out = await ResumeAi.aiShortenSkills(userId, parsed.data);
  if (out.ok) revalidateProject(parsed.data.projectId);
  return out;
}

export async function aiGrammarAdditionalAction(
  raw: unknown,
): Promise<AiResult<{ text: string }>> {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false, error: "Sign-in required.", code: "AUTH" };
  const parsed = additionalTextInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Invalid text.", code: "VALIDATION" };
  }
  const out = await ResumeAi.aiGrammarText(userId, parsed.data);
  if (out.ok) revalidateProject(parsed.data.projectId);
  return out;
}

export async function aiPolishEducationDetailsAction(
  raw: unknown,
): Promise<AiResult<{ details: string }>> {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false, error: "Sign-in required.", code: "AUTH" };
  const parsed = educationPolishInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Check your education fields and try again.", code: "VALIDATION" };
  }
  const out = await ResumeAi.aiPolishEducationDetails(userId, parsed.data);
  if (out.ok) revalidateProject(parsed.data.projectId);
  return out;
}

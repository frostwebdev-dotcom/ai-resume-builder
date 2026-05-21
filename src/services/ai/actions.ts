"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { tryLogAiSuggestion } from "@/lib/ai/usage-logger";
import { GUEST_AI_PROJECT_ID, guestAiUserKey, isGuestAiProjectId } from "@/lib/ai/guest";
import { ROUTES } from "@/lib/constants";
import { getClientIp } from "@/lib/security/client-ip";
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

async function getAiUserIdForProject(projectId: string): Promise<AiResult<string>> {
  const userId = await getSessionUserId();
  if (userId) return { ok: true, data: userId };
  if (isGuestAiProjectId(projectId)) {
    const ip = await getClientIp();
    return { ok: true, data: guestAiUserKey(ip) };
  }
  return { ok: false, error: "Sign-in required.", code: "AUTH" };
}

function revalidateProject(projectId: string) {
  if (projectId === GUEST_AI_PROJECT_ID) return;
  revalidatePath(ROUTES.app.projectBuild(projectId));
  revalidatePath(ROUTES.app.project(projectId));
}

export async function aiGenerateSummaryAction(
  raw: unknown,
): Promise<AiResult<{ headline: string; summary: string }>> {
  const parsed = summaryGenerateInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Check your inputs and try again.", code: "VALIDATION" };
  }
  const aiUser = await getAiUserIdForProject(parsed.data.projectId);
  if (!aiUser.ok) return aiUser;
  const out = await ResumeAi.aiGenerateSummary(aiUser.data, parsed.data);
  if (out.ok) revalidateProject(parsed.data.projectId);
  return out;
}

export async function aiTailorSummaryAction(
  raw: unknown,
): Promise<AiResult<{ headline: string; summary: string }>> {
  const parsed = summaryTailorInput.safeParse(raw);
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors.targetRole?.[0];
    return {
      ok: false,
      error: msg ?? "Add a target role and try again.",
      code: "VALIDATION",
    };
  }
  const aiUser = await getAiUserIdForProject(parsed.data.projectId);
  if (!aiUser.ok) return aiUser;
  const out = await ResumeAi.aiTailorSummary(aiUser.data, parsed.data);
  if (out.ok) revalidateProject(parsed.data.projectId);
  return out;
}

export async function aiShortenSummaryAction(
  raw: unknown,
): Promise<AiResult<{ headline: string; summary: string }>> {
  const parsed = summaryTextOpInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Invalid summary fields.", code: "VALIDATION" };
  }
  const aiUser = await getAiUserIdForProject(parsed.data.projectId);
  if (!aiUser.ok) return aiUser;
  const out = await ResumeAi.aiShortenSummary(aiUser.data, parsed.data);
  if (out.ok) revalidateProject(parsed.data.projectId);
  return out;
}

export async function aiExpandSummaryAction(
  raw: unknown,
): Promise<AiResult<{ headline: string; summary: string }>> {
  const parsed = summaryTextOpInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Invalid summary fields.", code: "VALIDATION" };
  }
  const aiUser = await getAiUserIdForProject(parsed.data.projectId);
  if (!aiUser.ok) return aiUser;
  const out = await ResumeAi.aiExpandSummary(aiUser.data, parsed.data);
  if (out.ok) revalidateProject(parsed.data.projectId);
  return out;
}

export async function aiGrammarSummaryAction(
  raw: unknown,
): Promise<AiResult<{ headline: string; summary: string }>> {
  const parsed = summaryTextOpInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Invalid summary fields.", code: "VALIDATION" };
  }
  const aiUser = await getAiUserIdForProject(parsed.data.projectId);
  if (!aiUser.ok) return aiUser;
  const out = await ResumeAi.aiGrammarSummary(aiUser.data, parsed.data);
  if (out.ok) revalidateProject(parsed.data.projectId);
  return out;
}

export async function aiImproveSummaryAction(
  raw: unknown,
): Promise<AiResult<{ headline: string; summary: string }>> {
  const parsed = summaryImproveInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Invalid summary fields.", code: "VALIDATION" };
  }
  const aiUser = await getAiUserIdForProject(parsed.data.projectId);
  if (!aiUser.ok) return aiUser;
  const out = await ResumeAi.aiImproveSummary(aiUser.data, parsed.data);
  if (out.ok) revalidateProject(parsed.data.projectId);
  return out;
}

export async function aiProfessionalSummaryAction(
  raw: unknown,
): Promise<AiResult<{ headline: string; summary: string }>> {
  const parsed = summaryImproveInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Invalid summary fields.", code: "VALIDATION" };
  }
  const aiUser = await getAiUserIdForProject(parsed.data.projectId);
  if (!aiUser.ok) return aiUser;
  const out = await ResumeAi.aiProfessionalSummary(aiUser.data, parsed.data);
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
  const parsed = logAiSuggestionInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Invalid payload.", code: "VALIDATION" };
  }
  if (isGuestAiProjectId(parsed.data.projectId)) return { ok: true };
  const userId = await getSessionUserId();
  if (!userId) return { ok: false, error: "Sign-in required.", code: "AUTH" };
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
  const parsed = experienceBulletsInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Invalid experience fields.", code: "VALIDATION" };
  }
  const aiUser = await getAiUserIdForProject(parsed.data.projectId);
  if (!aiUser.ok) return aiUser;
  const out = await ResumeAi.aiRewriteExperienceBullets(aiUser.data, parsed.data);
  if (out.ok) revalidateProject(parsed.data.projectId);
  return out;
}

export async function aiStrengthenExperienceBulletsAction(
  raw: unknown,
): Promise<AiResult<{ bullets: string[] }>> {
  const parsed = experienceBulletsInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Invalid experience fields.", code: "VALIDATION" };
  }
  const aiUser = await getAiUserIdForProject(parsed.data.projectId);
  if (!aiUser.ok) return aiUser;
  const out = await ResumeAi.aiStrengthenExperienceBullets(aiUser.data, parsed.data);
  if (out.ok) revalidateProject(parsed.data.projectId);
  return out;
}

export async function aiShortenExperienceBulletsAction(
  raw: unknown,
): Promise<AiResult<{ bullets: string[] }>> {
  const parsed = experienceBulletsInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Invalid experience fields.", code: "VALIDATION" };
  }
  const aiUser = await getAiUserIdForProject(parsed.data.projectId);
  if (!aiUser.ok) return aiUser;
  const out = await ResumeAi.aiShortenExperienceBullets(aiUser.data, parsed.data);
  if (out.ok) revalidateProject(parsed.data.projectId);
  return out;
}

export async function aiExpandExperienceBulletsAction(
  raw: unknown,
): Promise<AiResult<{ bullets: string[] }>> {
  const parsed = experienceBulletsInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Invalid experience fields.", code: "VALIDATION" };
  }
  const aiUser = await getAiUserIdForProject(parsed.data.projectId);
  if (!aiUser.ok) return aiUser;
  const out = await ResumeAi.aiExpandExperienceBullets(aiUser.data, parsed.data);
  if (out.ok) revalidateProject(parsed.data.projectId);
  return out;
}

export async function aiRephraseSkillsAction(
  raw: unknown,
): Promise<AiResult<{ lines: string }>> {
  const parsed = skillsTextInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Invalid skills text.", code: "VALIDATION" };
  }
  const aiUser = await getAiUserIdForProject(parsed.data.projectId);
  if (!aiUser.ok) return aiUser;
  const out = await ResumeAi.aiRephraseSkills(aiUser.data, parsed.data);
  if (out.ok) revalidateProject(parsed.data.projectId);
  return out;
}

export async function aiShortenSkillsAction(
  raw: unknown,
): Promise<AiResult<{ lines: string }>> {
  const parsed = skillsTextInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Invalid skills text.", code: "VALIDATION" };
  }
  const aiUser = await getAiUserIdForProject(parsed.data.projectId);
  if (!aiUser.ok) return aiUser;
  const out = await ResumeAi.aiShortenSkills(aiUser.data, parsed.data);
  if (out.ok) revalidateProject(parsed.data.projectId);
  return out;
}

export async function aiGrammarAdditionalAction(
  raw: unknown,
): Promise<AiResult<{ text: string }>> {
  const parsed = additionalTextInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Invalid text.", code: "VALIDATION" };
  }
  const aiUser = await getAiUserIdForProject(parsed.data.projectId);
  if (!aiUser.ok) return aiUser;
  const out = await ResumeAi.aiGrammarText(aiUser.data, parsed.data);
  if (out.ok) revalidateProject(parsed.data.projectId);
  return out;
}

export async function aiPolishEducationDetailsAction(
  raw: unknown,
): Promise<AiResult<{ details: string }>> {
  const parsed = educationPolishInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Check your education fields and try again.", code: "VALIDATION" };
  }
  const aiUser = await getAiUserIdForProject(parsed.data.projectId);
  if (!aiUser.ok) return aiUser;
  const out = await ResumeAi.aiPolishEducationDetails(aiUser.data, parsed.data);
  if (out.ok) revalidateProject(parsed.data.projectId);
  return out;
}

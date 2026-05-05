import "server-only";

import { assertResumeProjectOwned } from "@/services/ai/assert-project";
import { runStructuredGeneration } from "@/services/ai/generation-core";
import { AI_OPERATION_IDS } from "@/services/ai/prompts/registry";
import * as UserMessages from "@/services/ai/prompts/user-messages";
import {
  bulletsOutputSchema,
  educationDetailsOutputSchema,
  linesOutputSchema,
  summaryPairOutputSchema,
  textOutputSchema,
} from "@/services/ai/schemas/outputs";
import {
  assertReasonablePayloadSize,
  additionalTextInput,
  educationPolishInput,
  experienceBulletsInput,
  skillsTextInput,
  summaryGenerateInput,
  summaryTailorInput,
  summaryTextOpInput,
  tailorJobExperienceInput,
  tailorJobSkillsInput,
  tailorJobSummaryInput,
} from "@/validation/ai";
import type { z } from "zod";

export type Gen<T> = { ok: true; data: T } | { ok: false; error: string; code?: string };

type GenAsync<T> = Promise<Gen<T>>;

function tryPayload(parts: string[], label: string): true | Gen<never> {
  try {
    assertReasonablePayloadSize(parts, label);
    return true;
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Request too large.",
      code: "PAYLOAD",
    };
  }
}

async function guardProject(
  userId: string,
  projectId: string,
): Promise<true | Gen<never>> {
  const ok = await assertResumeProjectOwned(userId, projectId);
  if (!ok) return { ok: false, error: "Project not found.", code: "NOT_FOUND" };
  return true;
}

export async function aiGenerateSummary(
  userId: string,
  input: z.infer<typeof summaryGenerateInput>,
): GenAsync<{ headline: string; summary: string }> {
  const g = await guardProject(userId, input.projectId);
  if (g !== true) return g;
  const p = tryPayload(
    [input.headline, input.existingSummary, input.notes ?? ""],
    "Summary",
  );
  if (p !== true) return p;
  const userMessage = UserMessages.userMessageSummaryGenerate({
    headline: input.headline,
    existingSummary: input.existingSummary,
    notes: input.notes,
  });
  return runStructuredGeneration({
    operationId: AI_OPERATION_IDS.SUMMARY_GENERATE,
    userId,
    projectId: input.projectId,
    userMessage,
    outputSchema: summaryPairOutputSchema,
  });
}

export async function aiTailorSummary(
  userId: string,
  input: z.infer<typeof summaryTailorInput>,
): GenAsync<{ headline: string; summary: string }> {
  const g = await guardProject(userId, input.projectId);
  if (g !== true) return g;
  const p = tryPayload(
    [input.headline, input.summary, input.targetRole, input.jobFocus ?? ""],
    "Tailor",
  );
  if (p !== true) return p;
  const userMessage = UserMessages.userMessageSummaryTailor({
    headline: input.headline,
    summary: input.summary,
    targetRole: input.targetRole,
    jobFocus: input.jobFocus,
  });
  return runStructuredGeneration({
    operationId: AI_OPERATION_IDS.SUMMARY_TAILOR,
    userId,
    projectId: input.projectId,
    userMessage,
    outputSchema: summaryPairOutputSchema,
  });
}

export async function aiShortenSummary(
  userId: string,
  input: z.infer<typeof summaryTextOpInput>,
): GenAsync<{ headline: string; summary: string }> {
  const g = await guardProject(userId, input.projectId);
  if (g !== true) return g;
  const p = tryPayload([input.headline, input.summary], "Shorten");
  if (p !== true) return p;
  const userMessage = UserMessages.userMessageSummaryShorten({
    headline: input.headline,
    summary: input.summary,
  });
  return runStructuredGeneration({
    operationId: AI_OPERATION_IDS.SUMMARY_SHORTEN,
    userId,
    projectId: input.projectId,
    userMessage,
    outputSchema: summaryPairOutputSchema,
  });
}

export async function aiExpandSummary(
  userId: string,
  input: z.infer<typeof summaryTextOpInput>,
): GenAsync<{ headline: string; summary: string }> {
  const g = await guardProject(userId, input.projectId);
  if (g !== true) return g;
  const p = tryPayload([input.headline, input.summary], "Expand");
  if (p !== true) return p;
  const userMessage = UserMessages.userMessageSummaryExpand({
    headline: input.headline,
    summary: input.summary,
  });
  return runStructuredGeneration({
    operationId: AI_OPERATION_IDS.SUMMARY_EXPAND,
    userId,
    projectId: input.projectId,
    userMessage,
    outputSchema: summaryPairOutputSchema,
  });
}

export async function aiGrammarSummary(
  userId: string,
  input: z.infer<typeof summaryTextOpInput>,
): GenAsync<{ headline: string; summary: string }> {
  const g = await guardProject(userId, input.projectId);
  if (g !== true) return g;
  const p = tryPayload([input.headline, input.summary], "Grammar");
  if (p !== true) return p;
  const userMessage = UserMessages.userMessageSummaryGrammar({
    headline: input.headline,
    summary: input.summary,
  });
  return runStructuredGeneration({
    operationId: AI_OPERATION_IDS.SUMMARY_GRAMMAR,
    userId,
    projectId: input.projectId,
    userMessage,
    outputSchema: summaryPairOutputSchema,
  });
}

export async function aiRewriteExperienceBullets(
  userId: string,
  input: z.infer<typeof experienceBulletsInput>,
): GenAsync<{ bullets: string[] }> {
  const g = await guardProject(userId, input.projectId);
  if (g !== true) return g;
  const p = tryPayload(
    [input.company, input.title, ...input.bullets],
    "Experience",
  );
  if (p !== true) return p;
  const userMessage = UserMessages.userMessageExperienceBullets({
    company: input.company,
    title: input.title,
    bullets: input.bullets,
  });
  return runStructuredGeneration({
    operationId: AI_OPERATION_IDS.EXPERIENCE_REWRITE_BULLETS,
    userId,
    projectId: input.projectId,
    userMessage,
    outputSchema: bulletsOutputSchema,
  });
}

export async function aiStrengthenExperienceBullets(
  userId: string,
  input: z.infer<typeof experienceBulletsInput>,
): GenAsync<{ bullets: string[] }> {
  const g = await guardProject(userId, input.projectId);
  if (g !== true) return g;
  const p = tryPayload(
    [input.company, input.title, ...input.bullets],
    "Experience",
  );
  if (p !== true) return p;
  const userMessage = UserMessages.userMessageExperienceStrengthen({
    company: input.company,
    title: input.title,
    bullets: input.bullets,
  });
  return runStructuredGeneration({
    operationId: AI_OPERATION_IDS.EXPERIENCE_STRENGTHEN,
    userId,
    projectId: input.projectId,
    userMessage,
    outputSchema: bulletsOutputSchema,
  });
}

export async function aiShortenExperienceBullets(
  userId: string,
  input: z.infer<typeof experienceBulletsInput>,
): GenAsync<{ bullets: string[] }> {
  const g = await guardProject(userId, input.projectId);
  if (g !== true) return g;
  const p = tryPayload(
    [input.company, input.title, ...input.bullets],
    "Experience",
  );
  if (p !== true) return p;
  const userMessage = UserMessages.userMessageExperienceShorten({
    company: input.company,
    title: input.title,
    bullets: input.bullets,
  });
  return runStructuredGeneration({
    operationId: AI_OPERATION_IDS.EXPERIENCE_SHORTEN,
    userId,
    projectId: input.projectId,
    userMessage,
    outputSchema: bulletsOutputSchema,
  });
}

export async function aiExpandExperienceBullets(
  userId: string,
  input: z.infer<typeof experienceBulletsInput>,
): GenAsync<{ bullets: string[] }> {
  const g = await guardProject(userId, input.projectId);
  if (g !== true) return g;
  const p = tryPayload(
    [input.company, input.title, ...input.bullets],
    "Experience",
  );
  if (p !== true) return p;
  const userMessage = UserMessages.userMessageExperienceExpand({
    company: input.company,
    title: input.title,
    bullets: input.bullets,
  });
  return runStructuredGeneration({
    operationId: AI_OPERATION_IDS.EXPERIENCE_EXPAND,
    userId,
    projectId: input.projectId,
    userMessage,
    outputSchema: bulletsOutputSchema,
  });
}

export async function aiRephraseSkills(
  userId: string,
  input: z.infer<typeof skillsTextInput>,
): GenAsync<{ lines: string }> {
  const g = await guardProject(userId, input.projectId);
  if (g !== true) return g;
  const pl = tryPayload([input.lines], "Skills");
  if (pl !== true) return pl;
  const userMessage = UserMessages.userMessageSkillsRephrase({ lines: input.lines });
  return runStructuredGeneration({
    operationId: AI_OPERATION_IDS.SKILLS_REPHRASE,
    userId,
    projectId: input.projectId,
    userMessage,
    outputSchema: linesOutputSchema,
  });
}

export async function aiShortenSkills(
  userId: string,
  input: z.infer<typeof skillsTextInput>,
): GenAsync<{ lines: string }> {
  const g = await guardProject(userId, input.projectId);
  if (g !== true) return g;
  const pl = tryPayload([input.lines], "Skills");
  if (pl !== true) return pl;
  const userMessage = UserMessages.userMessageSkillsShorten({ lines: input.lines });
  return runStructuredGeneration({
    operationId: AI_OPERATION_IDS.SKILLS_SHORTEN,
    userId,
    projectId: input.projectId,
    userMessage,
    outputSchema: linesOutputSchema,
  });
}

export async function aiTailorSummaryToJob(
  userId: string,
  input: z.infer<typeof tailorJobSummaryInput>,
): GenAsync<{ headline: string; summary: string }> {
  const g = await guardProject(userId, input.projectId);
  if (g !== true) return g;
  const p = tryPayload(
    [input.headline, input.summary, input.jobDescription],
    "Tailor to job",
  );
  if (p !== true) return p;
  const userMessage = UserMessages.userMessageSummaryTailorToJob({
    jobTitle: input.jobTitle,
    company: input.jobCompany,
    jobDescription: input.jobDescription,
    headline: input.headline,
    summary: input.summary,
  });
  return runStructuredGeneration({
    operationId: AI_OPERATION_IDS.SUMMARY_TAILOR_JOB,
    userId,
    projectId: input.projectId,
    userMessage,
    outputSchema: summaryPairOutputSchema,
  });
}

export async function aiTailorSkillsToJob(
  userId: string,
  input: z.infer<typeof tailorJobSkillsInput>,
): GenAsync<{ lines: string }> {
  const g = await guardProject(userId, input.projectId);
  if (g !== true) return g;
  const p = tryPayload([input.lines, input.jobDescription], "Tailor skills");
  if (p !== true) return p;
  const userMessage = UserMessages.userMessageSkillsTailorToJob({
    jobTitle: input.jobTitle,
    company: input.jobCompany,
    jobDescription: input.jobDescription,
    lines: input.lines,
  });
  return runStructuredGeneration({
    operationId: AI_OPERATION_IDS.SKILLS_TAILOR_JOB,
    userId,
    projectId: input.projectId,
    userMessage,
    outputSchema: linesOutputSchema,
  });
}

export async function aiTailorExperienceToJob(
  userId: string,
  input: z.infer<typeof tailorJobExperienceInput>,
): GenAsync<{ bullets: string[] }> {
  const g = await guardProject(userId, input.projectId);
  if (g !== true) return g;
  const p = tryPayload(
    [input.company, input.title, ...input.bullets, input.jobDescription],
    "Tailor experience",
  );
  if (p !== true) return p;
  const userMessage = UserMessages.userMessageExperienceTailorToJob({
    jobTitle: input.jobTitle,
    company: input.jobCompany,
    jobDescription: input.jobDescription,
    roleTitle: input.title,
    employer: input.company,
    bullets: input.bullets,
  });
  return runStructuredGeneration({
    operationId: AI_OPERATION_IDS.EXPERIENCE_TAILOR_JOB,
    userId,
    projectId: input.projectId,
    userMessage,
    outputSchema: bulletsOutputSchema,
  });
}

export async function aiPolishEducationDetails(
  userId: string,
  input: z.infer<typeof educationPolishInput>,
): GenAsync<{ details: string }> {
  const g = await guardProject(userId, input.projectId);
  if (g !== true) return g;
  const p = tryPayload(
    [input.school, input.degree, input.field, input.details],
    "Education",
  );
  if (p !== true) return p;
  const userMessage = UserMessages.userMessageEducationPolishDetails({
    school: input.school,
    degree: input.degree,
    field: input.field,
    details: input.details,
  });
  return runStructuredGeneration({
    operationId: AI_OPERATION_IDS.EDUCATION_POLISH_DETAILS,
    userId,
    projectId: input.projectId,
    userMessage,
    outputSchema: educationDetailsOutputSchema,
  });
}

export async function aiGrammarText(
  userId: string,
  input: z.infer<typeof additionalTextInput>,
): GenAsync<{ text: string }> {
  const g = await guardProject(userId, input.projectId);
  if (g !== true) return g;
  const pt = tryPayload([input.text], "Text");
  if (pt !== true) return pt;
  const userMessage = UserMessages.userMessageGrammar({ text: input.text });
  return runStructuredGeneration({
    operationId: AI_OPERATION_IDS.CONTENT_GRAMMAR,
    userId,
    projectId: input.projectId,
    userMessage,
    outputSchema: textOutputSchema,
  });
}

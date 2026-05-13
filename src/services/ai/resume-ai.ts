import "server-only";

import { resumeScoreOutputSchema } from "@/lib/ai/schemas";
import { tryLogAiSuggestion } from "@/lib/ai/usage-logger";
import { hydrateWizardState } from "@/lib/resume-wizard/parse";
import { wizardStateSchema } from "@/lib/resume-wizard/schema";
import type { WizardStateV1 } from "@/lib/resume-wizard/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
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
  summaryImproveInput,
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

export async function aiImproveSummary(
  userId: string,
  input: z.infer<typeof summaryImproveInput>,
): GenAsync<{ headline: string; summary: string }> {
  const g = await guardProject(userId, input.projectId);
  if (g !== true) return g;
  const p = tryPayload(
    [input.headline, input.summary, input.targetRoleHint ?? ""],
    "Improve",
  );
  if (p !== true) return p;
  const userMessage = UserMessages.userMessageSummaryImprove({
    headline: input.headline,
    summary: input.summary,
    targetRoleHint: input.targetRoleHint,
  });
  return runStructuredGeneration({
    operationId: AI_OPERATION_IDS.SUMMARY_IMPROVE,
    userId,
    projectId: input.projectId,
    userMessage,
    outputSchema: summaryPairOutputSchema,
  });
}

export async function aiProfessionalSummary(
  userId: string,
  input: z.infer<typeof summaryImproveInput>,
): GenAsync<{ headline: string; summary: string }> {
  const g = await guardProject(userId, input.projectId);
  if (g !== true) return g;
  const p = tryPayload(
    [input.headline, input.summary, input.targetRoleHint ?? ""],
    "Professional",
  );
  if (p !== true) return p;
  const userMessage = UserMessages.userMessageSummaryProfessional({
    headline: input.headline,
    summary: input.summary,
    targetRoleHint: input.targetRoleHint,
  });
  return runStructuredGeneration({
    operationId: AI_OPERATION_IDS.SUMMARY_PROFESSIONAL,
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

async function loadOwnedProjectWizard(
  userId: string,
  projectId: string,
): Promise<
  | { ok: true; wizard: WizardStateV1 }
  | { ok: false; error: string; code?: string }
> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("resume_projects")
    .select("metadata")
    .eq("id", projectId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: "Project not found.", code: "NOT_FOUND" };
  }

  const meta = data.metadata as Record<string, unknown> | null;
  const wizard = hydrateWizardState(meta?.wizard);
  const validated = wizardStateSchema.safeParse(wizard);
  if (!validated.success) {
    return {
      ok: false,
      error: "Resume data could not be read. Save your draft in the editor and try again.",
      code: "VALIDATION",
    };
  }
  return { ok: true, wizard: validated.data as WizardStateV1 };
}

function formatWizardResumePlainText(w: WizardStateV1): string {
  const parts: string[] = [];
  const name =
    w.personal.fullName.trim() ||
    `${w.personal.givenName} ${w.personal.familyName}`.trim() ||
    "(name not set)";
  parts.push("PERSONAL / TARGET");
  parts.push(`Name: ${name}`);
  parts.push(`Target role: ${w.personal.desiredJobPosition || "(not set)"}`);
  parts.push("");
  parts.push("PROFESSIONAL SUMMARY");
  parts.push(`Headline: ${w.summary.headline || "(empty)"}`);
  parts.push(`Summary: ${w.summary.summary || "(empty)"}`);
  parts.push("");
  parts.push("EXPERIENCE");
  for (const e of w.experience.entries) {
    parts.push(`- ${e.title} at ${e.company} (${e.startDate}–${e.current ? "present" : e.endDate})`);
    const maxBullets = 12;
    const hs = e.highlights.slice(0, maxBullets);
    for (const h of hs) {
      parts.push(`  • ${h}`);
    }
    if (e.highlights.length > maxBullets) {
      parts.push(`  … (${e.highlights.length - maxBullets} more bullets omitted)`);
    }
  }
  parts.push("");
  parts.push("EDUCATION");
  for (const ed of w.education.entries) {
    parts.push(`- ${ed.degree} in ${ed.field}, ${ed.school}`);
    if (ed.details.trim()) parts.push(`  ${ed.details.slice(0, 800)}`);
  }
  parts.push("");
  parts.push("SKILLS (lines)");
  parts.push(w.skills.lines || "(empty)");
  parts.push("");
  parts.push("CERTIFICATIONS");
  for (const c of w.certifications.entries) {
    parts.push(`- ${c.name} (${c.issuer})`);
  }
  parts.push("");
  parts.push("PROJECTS (titles + tech)");
  for (const p of w.projects.entries) {
    parts.push(`- ${p.name}: ${p.technologies || ""}`);
    if (p.description.trim()) parts.push(`  ${p.description.slice(0, 500)}`);
  }

  let text = parts.join("\n");
  if (text.length > 14_000) {
    text = `${text.slice(0, 14_000)}\n\n… (content truncated for scoring)`;
  }
  return text;
}

export async function aiScoreResume(
  userId: string,
  input: { projectId: string },
): GenAsync<z.infer<typeof resumeScoreOutputSchema>> {
  const g = await guardProject(userId, input.projectId);
  if (g !== true) return g;
  const loaded = await loadOwnedProjectWizard(userId, input.projectId);
  if (!loaded.ok) return loaded;
  const resumeText = formatWizardResumePlainText(loaded.wizard);
  const p = tryPayload([resumeText], "Resume");
  if (p !== true) return p;
  const userMessage = UserMessages.userMessageResumeScore({ resumeText });
  const out = await runStructuredGeneration({
    operationId: AI_OPERATION_IDS.RESUME_SCORE,
    userId,
    projectId: input.projectId,
    userMessage,
    outputSchema: resumeScoreOutputSchema,
  });
  if (out.ok) {
    await tryLogAiSuggestion({
      userId,
      projectId: input.projectId,
      kind: "resume.score",
      metadata: { overallScore: out.data.overallScore },
    });
  }
  return out;
}

export async function aiRewriteSingleBullet(
  userId: string,
  input: { projectId: string; entryId: string; company: string; title: string; bullet: string },
): GenAsync<{ bullets: string[] }> {
  return aiRewriteExperienceBullets(userId, {
    projectId: input.projectId,
    entryId: input.entryId,
    company: input.company,
    title: input.title,
    bullets: [input.bullet],
  });
}

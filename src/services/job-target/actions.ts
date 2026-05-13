"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { ROUTES } from "@/lib/constants";
import { clearTailoringSection, mergeTailoringCompare, parseTailoringCompare } from "@/lib/job-target/parse";
import type { JobTailorReviewV1, TailoringCompareV1 } from "@/lib/job-target/types";
import { assertJobTailoringPipelineAllowed } from "@/lib/monetization/job-tailor-gate";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import * as ResumeAi from "@/services/ai/resume-ai";
import { tryLogAiSuggestion } from "@/lib/ai/usage-logger";
import { fetchWizardStateForProject } from "@/services/resume-wizard/actions";
import { updateProjectWizardState } from "@/services/resume-wizard/persist-wizard";
import type { JobTarget, Json } from "@/types/database";
import {
  experienceBulletsInput,
  tailorSkillsJobActionInput,
  tailorSummaryJobActionInput,
} from "@/validation/ai";
import { saveJobTargetSchema } from "@/validation/job-target";

type Ok<T> = { ok: true; data: T };
type Err = { ok: false; error: string; code?: string };
type ActionResult<T> = Ok<T> | Err;

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

async function fetchLatestJobTargetRow(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  projectId: string,
  userId: string,
  columns: string,
) {
  const { data: project } = await supabase
    .from("resume_projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!project) return null;

  const { data: row } = await supabase
    .from("job_targets")
    .select(columns)
    .eq("project_id", projectId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return row as JobTarget | null;
}

function stripTailoringCompare(meta: Json): Json {
  const base =
    meta && typeof meta === "object" && !Array.isArray(meta)
      ? (meta as Record<string, unknown>)
      : {};
  const { tailoring_compare: _, job_tailor_review: __, ...rest } = base;
  void _;
  void __;
  return rest as Json;
}

export async function saveJobTargetAction(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false, error: "Sign in to save.", code: "AUTH" };

  const parsed = saveJobTargetSchema.safeParse(raw);
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors.jobDescription?.[0];
    return {
      ok: false,
      error: msg ?? "Check your job description and try again.",
      code: "VALIDATION",
    };
  }

  const { projectId, title, company, jobDescription } = parsed.data;
  const supabase = await createSupabaseServerClient();

  const existing = await fetchLatestJobTargetRow(
    supabase,
    projectId,
    userId,
    "id, job_description, metadata",
  );

  const nextTitle = title?.trim() || null;
  const nextCompany = company?.trim() || null;
  const jd = jobDescription.trim();

  let metadata: Json = (existing?.metadata as Json) ?? {};
  const prevJd = existing?.job_description?.trim() ?? null;
  if (prevJd !== jd) {
    metadata = stripTailoringCompare(metadata);
  }

  if (existing?.id) {
    const { error } = await supabase
      .from("job_targets")
      .update({
        title: nextTitle,
        company: nextCompany,
        job_description: jd,
        metadata,
      })
      .eq("id", existing.id)
      .eq("project_id", projectId);

    if (error) return { ok: false, error: error.message };
    revalidateProject(projectId);
    return { ok: true, data: { id: existing.id } };
  }

  const { data: inserted, error: insErr } = await supabase
    .from("job_targets")
    .insert({
      project_id: projectId,
      title: nextTitle,
      company: nextCompany,
      job_description: jd,
      metadata,
    })
    .select("id")
    .single();

  if (insErr || !inserted) {
    return { ok: false, error: insErr?.message ?? "Could not save job target." };
  }
  revalidateProject(projectId);
  return { ok: true, data: { id: inserted.id } };
}

export async function tailorSummaryToJobAction(
  raw: unknown,
): Promise<ActionResult<{ tailoringCompare: TailoringCompareV1 | null }>> {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false, error: "Sign-in required.", code: "AUTH" };

  const parsed = tailorSummaryJobActionInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Invalid summary fields.", code: "VALIDATION" };
  }

  const supabase = await createSupabaseServerClient();
  const row = await fetchLatestJobTargetRow(
    supabase,
    parsed.data.projectId,
    userId,
    "id, metadata, job_description, title, company",
  );

  if (!row?.id) {
    return { ok: false, error: "Save a job description first.", code: "NO_JOB" };
  }

  const jd = (row.job_description as string | null)?.trim();
  if (!jd) {
    return { ok: false, error: "Save a job description first.", code: "NO_JOB" };
  }

  const jobTitle = (row.title as string | null) ?? null;
  const jobCompany = (row.company as string | null) ?? null;

  const ai = await ResumeAi.aiTailorSummaryToJob(userId, {
    projectId: parsed.data.projectId,
    headline: parsed.data.headline,
    summary: parsed.data.summary,
    jobTitle,
    jobCompany,
    jobDescription: jd,
  });

  if (!ai.ok) return ai;

  const generatedAt = new Date().toISOString();
  const before = { headline: parsed.data.headline, summary: parsed.data.summary };
  const after = { headline: ai.data.headline, summary: ai.data.summary };

  const meta = row.metadata as Json;
  const nextMeta = mergeTailoringCompare(meta, {
    summary: { before, after, generatedAt },
  });

  const { error } = await supabase
    .from("job_targets")
    .update({ metadata: nextMeta })
    .eq("id", row.id)
    .eq("project_id", parsed.data.projectId);

  if (error) return { ok: false, error: error.message };

  revalidateProject(parsed.data.projectId);
  const tailoringCompare = parseTailoringCompare(
    (nextMeta as Record<string, unknown>).tailoring_compare,
  );
  return { ok: true, data: { tailoringCompare } };
}

export async function tailorSkillsToJobAction(
  raw: unknown,
): Promise<ActionResult<{ tailoringCompare: TailoringCompareV1 | null }>> {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false, error: "Sign-in required.", code: "AUTH" };

  const parsed = tailorSkillsJobActionInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Invalid skills fields.", code: "VALIDATION" };
  }

  const supabase = await createSupabaseServerClient();
  const row = await fetchLatestJobTargetRow(
    supabase,
    parsed.data.projectId,
    userId,
    "id, metadata, job_description, title, company",
  );

  if (!row?.id) {
    return { ok: false, error: "Save a job description first.", code: "NO_JOB" };
  }

  const jd = (row.job_description as string | null)?.trim();
  if (!jd) {
    return { ok: false, error: "Save a job description first.", code: "NO_JOB" };
  }

  const jobTitle = (row.title as string | null) ?? null;
  const jobCompany = (row.company as string | null) ?? null;

  const ai = await ResumeAi.aiTailorSkillsToJob(userId, {
    projectId: parsed.data.projectId,
    lines: parsed.data.lines,
    jobTitle,
    jobCompany,
    jobDescription: jd,
  });

  if (!ai.ok) return ai;

  const generatedAt = new Date().toISOString();
  const before = { lines: parsed.data.lines };
  const after = { lines: ai.data.lines };

  const meta = row.metadata as Json;
  const nextMeta = mergeTailoringCompare(meta, {
    skills: { before, after, generatedAt },
  });

  const { error } = await supabase
    .from("job_targets")
    .update({ metadata: nextMeta })
    .eq("id", row.id)
    .eq("project_id", parsed.data.projectId);

  if (error) return { ok: false, error: error.message };

  revalidateProject(parsed.data.projectId);
  const tailoringCompare = parseTailoringCompare(
    (nextMeta as Record<string, unknown>).tailoring_compare,
  );
  return { ok: true, data: { tailoringCompare } };
}

export async function tailorExperienceToJobAction(
  raw: unknown,
): Promise<ActionResult<{ tailoringCompare: TailoringCompareV1 | null }>> {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false, error: "Sign-in required.", code: "AUTH" };

  const parsed = experienceBulletsInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Invalid experience fields.", code: "VALIDATION" };
  }

  const supabase = await createSupabaseServerClient();
  const row = await fetchLatestJobTargetRow(
    supabase,
    parsed.data.projectId,
    userId,
    "id, metadata, job_description, title, company",
  );

  if (!row?.id) {
    return { ok: false, error: "Save a job description first.", code: "NO_JOB" };
  }

  const jd = (row.job_description as string | null)?.trim();
  if (!jd) {
    return { ok: false, error: "Save a job description first.", code: "NO_JOB" };
  }

  const jobTitle = (row.title as string | null) ?? null;
  const jobCompany = (row.company as string | null) ?? null;

  const ai = await ResumeAi.aiTailorExperienceToJob(userId, {
    projectId: parsed.data.projectId,
    entryId: parsed.data.entryId,
    company: parsed.data.company,
    title: parsed.data.title,
    bullets: parsed.data.bullets,
    jobTitle,
    jobCompany,
    jobDescription: jd,
  });

  if (!ai.ok) return ai;

  const generatedAt = new Date().toISOString();
  const before = { bullets: parsed.data.bullets };
  const after = { bullets: ai.data.bullets };

  const meta = row.metadata as Json;
  const nextMeta = mergeTailoringCompare(meta, {
    experience: {
      [parsed.data.entryId]: { before, after, generatedAt },
    },
  });

  const { error } = await supabase
    .from("job_targets")
    .update({ metadata: nextMeta })
    .eq("id", row.id)
    .eq("project_id", parsed.data.projectId);

  if (error) return { ok: false, error: error.message };

  revalidateProject(parsed.data.projectId);
  const tailoringCompare = parseTailoringCompare(
    (nextMeta as Record<string, unknown>).tailoring_compare,
  );
  return { ok: true, data: { tailoringCompare } };
}

const acceptRejectSchema = z.object({
  projectId: z.string().uuid(),
});

const acceptExperienceSchema = z.object({
  projectId: z.string().uuid(),
  entryId: z.string().uuid(),
});

export async function acceptTailoredSummaryAction(
  raw: unknown,
): Promise<ActionResult<{ ok: true }>> {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false, error: "Sign-in required.", code: "AUTH" };

  const parsed = acceptRejectSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Invalid request.", code: "VALIDATION" };
  }

  const { projectId } = parsed.data;
  const supabase = await createSupabaseServerClient();

  const row = await fetchLatestJobTargetRow(
    supabase,
    projectId,
    userId,
    "id, metadata",
  );

  if (!row?.id) return { ok: false, error: "Nothing to apply.", code: "NOT_FOUND" };

  const meta = row.metadata as Json;
  const compare = parseTailoringCompare(
    (meta as Record<string, unknown>).tailoring_compare,
  );
  if (!compare?.summary?.after) {
    return { ok: false, error: "No tailored summary to apply.", code: "NOT_FOUND" };
  }

  const up = await updateProjectWizardState(userId, projectId, (draft) => ({
    ...draft,
    summary: {
      headline: compare.summary!.after.headline,
      summary: compare.summary!.after.summary,
    },
  }));

  if (!up.ok) return { ok: false, error: up.error };

  const cleared = clearTailoringSection(meta, "summary");
  const { error } = await supabase
    .from("job_targets")
    .update({ metadata: cleared })
    .eq("id", row.id)
    .eq("project_id", projectId);

  if (error) return { ok: false, error: error.message };

  revalidateProject(projectId);
  return { ok: true, data: { ok: true } };
}

export async function rejectTailoredSummaryAction(
  raw: unknown,
): Promise<ActionResult<{ ok: true }>> {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false, error: "Sign-in required.", code: "AUTH" };

  const parsed = acceptRejectSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Invalid request.", code: "VALIDATION" };
  }

  const { projectId } = parsed.data;
  const supabase = await createSupabaseServerClient();

  const row = await fetchLatestJobTargetRow(
    supabase,
    projectId,
    userId,
    "id, metadata",
  );

  if (!row?.id) return { ok: false, error: "Nothing to update.", code: "NOT_FOUND" };

  const meta = row.metadata as Json;
  const cleared = clearTailoringSection(meta, "summary");
  const { error } = await supabase
    .from("job_targets")
    .update({ metadata: cleared })
    .eq("id", row.id)
    .eq("project_id", projectId);

  if (error) return { ok: false, error: error.message };

  revalidateProject(projectId);
  return { ok: true, data: { ok: true } };
}

export async function acceptTailoredSkillsAction(
  raw: unknown,
): Promise<ActionResult<{ ok: true }>> {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false, error: "Sign-in required.", code: "AUTH" };

  const parsed = acceptRejectSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Invalid request.", code: "VALIDATION" };
  }

  const { projectId } = parsed.data;
  const supabase = await createSupabaseServerClient();

  const row = await fetchLatestJobTargetRow(
    supabase,
    projectId,
    userId,
    "id, metadata",
  );

  if (!row?.id) return { ok: false, error: "Nothing to apply.", code: "NOT_FOUND" };

  const meta = row.metadata as Json;
  const compare = parseTailoringCompare(
    (meta as Record<string, unknown>).tailoring_compare,
  );
  if (!compare?.skills?.after) {
    return { ok: false, error: "No tailored skills to apply.", code: "NOT_FOUND" };
  }

  const up = await updateProjectWizardState(userId, projectId, (draft) => ({
    ...draft,
    skills: { lines: compare.skills!.after.lines },
  }));

  if (!up.ok) return { ok: false, error: up.error };

  const cleared = clearTailoringSection(meta, "skills");
  const { error } = await supabase
    .from("job_targets")
    .update({ metadata: cleared })
    .eq("id", row.id)
    .eq("project_id", projectId);

  if (error) return { ok: false, error: error.message };

  revalidateProject(projectId);
  return { ok: true, data: { ok: true } };
}

export async function rejectTailoredSkillsAction(
  raw: unknown,
): Promise<ActionResult<{ ok: true }>> {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false, error: "Sign-in required.", code: "AUTH" };

  const parsed = acceptRejectSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Invalid request.", code: "VALIDATION" };
  }

  const { projectId } = parsed.data;
  const supabase = await createSupabaseServerClient();

  const row = await fetchLatestJobTargetRow(
    supabase,
    projectId,
    userId,
    "id, metadata",
  );

  if (!row?.id) return { ok: false, error: "Nothing to update.", code: "NOT_FOUND" };

  const meta = row.metadata as Json;
  const cleared = clearTailoringSection(meta, "skills");
  const { error } = await supabase
    .from("job_targets")
    .update({ metadata: cleared })
    .eq("id", row.id)
    .eq("project_id", projectId);

  if (error) return { ok: false, error: error.message };

  revalidateProject(projectId);
  return { ok: true, data: { ok: true } };
}

export async function acceptTailoredExperienceAction(
  raw: unknown,
): Promise<ActionResult<{ ok: true }>> {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false, error: "Sign-in required.", code: "AUTH" };

  const parsed = acceptExperienceSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Invalid request.", code: "VALIDATION" };
  }

  const { projectId, entryId } = parsed.data;
  const supabase = await createSupabaseServerClient();

  const row = await fetchLatestJobTargetRow(
    supabase,
    projectId,
    userId,
    "id, metadata",
  );

  if (!row?.id) return { ok: false, error: "Nothing to apply.", code: "NOT_FOUND" };

  const meta = row.metadata as Json;
  const compare = parseTailoringCompare(
    (meta as Record<string, unknown>).tailoring_compare,
  );
  const slice = compare?.experience?.[entryId];
  if (!slice?.after) {
    return { ok: false, error: "No tailored bullets to apply.", code: "NOT_FOUND" };
  }

  const up = await updateProjectWizardState(userId, projectId, (draft) => {
    const entries = draft.experience.entries.map((e) =>
      e.id === entryId
        ? { ...e, highlights: slice.after.bullets.length ? slice.after.bullets : [""] }
        : e,
    );
    return { ...draft, experience: { entries } };
  });

  if (!up.ok) return { ok: false, error: up.error };

  const cleared = clearTailoringSection(meta, "experience", entryId);
  const { error } = await supabase
    .from("job_targets")
    .update({ metadata: cleared })
    .eq("id", row.id)
    .eq("project_id", projectId);

  if (error) return { ok: false, error: error.message };

  revalidateProject(projectId);
  return { ok: true, data: { ok: true } };
}

export async function rejectTailoredExperienceAction(
  raw: unknown,
): Promise<ActionResult<{ ok: true }>> {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false, error: "Sign-in required.", code: "AUTH" };

  const parsed = acceptExperienceSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Invalid request.", code: "VALIDATION" };
  }

  const { projectId, entryId } = parsed.data;
  const supabase = await createSupabaseServerClient();

  const row = await fetchLatestJobTargetRow(
    supabase,
    projectId,
    userId,
    "id, metadata",
  );

  if (!row?.id) return { ok: false, error: "Nothing to update.", code: "NOT_FOUND" };

  const meta = row.metadata as Json;
  const cleared = clearTailoringSection(meta, "experience", entryId);
  const { error } = await supabase
    .from("job_targets")
    .update({ metadata: cleared })
    .eq("id", row.id)
    .eq("project_id", projectId);

  if (error) return { ok: false, error: error.message };

  revalidateProject(projectId);
  return { ok: true, data: { ok: true } };
}

const pipelineInputSchema = z.object({
  projectId: z.string().uuid(),
});

export async function runJobTailoringPipelineAction(
  raw: unknown,
): Promise<
  ActionResult<{
    tailoringCompare: TailoringCompareV1 | null;
    jobTailorReview: JobTailorReviewV1 | null;
    pipelineWarnings: string[];
    remainingFreeRuns: number | null;
  }>
> {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false, error: "Sign-in required.", code: "AUTH" };

  const gate = await assertJobTailoringPipelineAllowed(userId);
  if (!gate.ok) {
    return { ok: false, error: gate.error, code: gate.code };
  }

  const parsed = pipelineInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Invalid project.", code: "VALIDATION" };
  }

  const { projectId } = parsed.data;
  const wizard = await fetchWizardStateForProject(userId, projectId);
  if (!wizard) {
    return {
      ok: false,
      error: "Resume draft not found. Save the editor and try again.",
      code: "NOT_FOUND",
    };
  }

  const supabase = await createSupabaseServerClient();
  const row = await fetchLatestJobTargetRow(
    supabase,
    projectId,
    userId,
    "id, metadata, job_description, title, company",
  );

  if (!row?.id) {
    return { ok: false, error: "Save a job description first.", code: "NO_JOB" };
  }

  const jd = (row.job_description as string | null)?.trim();
  if (!jd) {
    return { ok: false, error: "Save a job description first.", code: "NO_JOB" };
  }

  const jobTitle = (row.title as string | null) ?? null;
  const jobCompany = (row.company as string | null) ?? null;

  const generatedAt = new Date().toISOString();
  const resumePlainText = ResumeAi.formatWizardResumePlainText(wizard);
  const pipelineWarnings: string[] = [];

  const nextCompare: TailoringCompareV1 = { v: 1 };
  let jobTailorReview: JobTailorReviewV1 | null = null;

  const reviewRes = await ResumeAi.aiJobTailorResumeReview(userId, {
    projectId,
    resumePlainText,
    jobTitle,
    jobCompany,
    jobDescription: jd,
  });
  if (reviewRes.ok) {
    jobTailorReview = {
      v: 1,
      generatedAt,
      alignmentHighlights: reviewRes.data.alignmentHighlights,
      improvementIdeas: reviewRes.data.improvementIdeas,
    };
  } else {
    pipelineWarnings.push(`Job fit review: ${reviewRes.error}`);
  }

  const sumRes = await ResumeAi.aiTailorSummaryToJob(userId, {
    projectId,
    headline: wizard.summary.headline,
    summary: wizard.summary.summary,
    jobTitle,
    jobCompany,
    jobDescription: jd,
  });
  if (sumRes.ok) {
    nextCompare.summary = {
      before: { headline: wizard.summary.headline, summary: wizard.summary.summary },
      after: { headline: sumRes.data.headline, summary: sumRes.data.summary },
      generatedAt,
    };
  } else {
    pipelineWarnings.push(`Summary: ${sumRes.error}`);
  }

  const skRes = await ResumeAi.aiTailorSkillsToJob(userId, {
    projectId,
    lines: wizard.skills.lines,
    jobTitle,
    jobCompany,
    jobDescription: jd,
  });
  if (skRes.ok) {
    nextCompare.skills = {
      before: { lines: wizard.skills.lines },
      after: { lines: skRes.data.lines },
      generatedAt,
    };
  } else {
    pipelineWarnings.push(`Skills: ${skRes.error}`);
  }

  const experiencePatches: NonNullable<TailoringCompareV1["experience"]> = {};
  for (const entry of wizard.experience.entries) {
    const bullets = entry.highlights.filter((b) => b.trim().length > 0);
    if (bullets.length === 0) continue;
    const exRes = await ResumeAi.aiTailorExperienceToJob(userId, {
      projectId,
      entryId: entry.id,
      company: entry.company || "Company",
      title: entry.title || "Role",
      bullets,
      jobTitle,
      jobCompany,
      jobDescription: jd,
    });
    if (exRes.ok) {
      experiencePatches[entry.id] = {
        before: { bullets },
        after: { bullets: exRes.data.bullets },
        generatedAt,
      };
    } else {
      pipelineWarnings.push(`Experience (${entry.title || "role"}): ${exRes.error}`);
    }
  }
  if (Object.keys(experiencePatches).length > 0) {
    nextCompare.experience = experiencePatches;
  }

  const hasSections = Boolean(
    nextCompare.summary ||
      nextCompare.skills ||
      (nextCompare.experience && Object.keys(nextCompare.experience).length > 0),
  );
  const hasReview =
    jobTailorReview &&
    (jobTailorReview.alignmentHighlights.length > 0 || jobTailorReview.improvementIdeas.length > 0);

  if (!hasSections && !hasReview) {
    return {
      ok: false,
      error:
        "Could not generate tailoring suggestions. Try again or shorten the job description.",
      code: "AI_PARTIAL",
    };
  }

  const baseMeta =
    row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
      ? ({ ...(row.metadata as Record<string, unknown>) } as Record<string, unknown>)
      : {};

  if (hasSections) {
    baseMeta.tailoring_compare = nextCompare;
  } else {
    delete baseMeta.tailoring_compare;
  }

  if (hasReview && jobTailorReview) {
    baseMeta.job_tailor_review = jobTailorReview;
  } else {
    delete baseMeta.job_tailor_review;
  }

  const { error } = await supabase
    .from("job_targets")
    .update({ metadata: baseMeta as Json })
    .eq("id", row.id)
    .eq("project_id", projectId);

  if (error) return { ok: false, error: error.message };

  await tryLogAiSuggestion({
    userId,
    projectId,
    kind: "job.tailor.pipeline",
    metadata: {
      summary: Boolean(nextCompare.summary),
      skills: Boolean(nextCompare.skills),
      experienceRoles: Object.keys(nextCompare.experience ?? {}).length,
      review: Boolean(hasReview),
    },
  });

  revalidateProject(projectId);

  const tailoringCompare = hasSections ? nextCompare : null;
  const remainingFreeRuns = gate.unlimited
    ? null
    : Math.max(0, gate.cap - gate.used - 1);

  return {
    ok: true,
    data: {
      tailoringCompare,
      jobTailorReview: hasReview ? jobTailorReview : null,
      pipelineWarnings,
      remainingFreeRuns,
    },
  };
}

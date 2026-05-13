import "server-only";

import type {
  ApiGenerateSummaryBody,
  ApiRewriteBulletBody,
  ApiScoreResumeBody,
  ApiTailorResumeBody,
} from "@/lib/ai/schemas";
import {
  toTailorJobExperienceInput,
  toTailorJobSkillsInput,
  toTailorJobSummaryInput,
} from "@/lib/ai/schemas";
import * as ResumeAi from "@/services/ai/resume-ai";

/**
 * HTTP-facing resume AI entry points. All OpenAI traffic stays on the server
 * (these delegate to `services/ai/resume-ai` + `generation-core`).
 */
export async function generateResumeSummary(userId: string, body: ApiGenerateSummaryBody) {
  return ResumeAi.aiGenerateSummary(userId, body);
}

export async function rewriteResumeBullet(userId: string, body: ApiRewriteBulletBody) {
  return ResumeAi.aiRewriteSingleBullet(userId, {
    projectId: body.projectId,
    entryId: body.entryId,
    company: body.company,
    title: body.title,
    bullet: body.bullet,
  });
}

export async function scoreResume(userId: string, body: ApiScoreResumeBody) {
  return ResumeAi.aiScoreResume(userId, { projectId: body.projectId });
}

export async function tailorResume(userId: string, body: ApiTailorResumeBody) {
  switch (body.section) {
    case "summary":
      return ResumeAi.aiTailorSummaryToJob(userId, toTailorJobSummaryInput(body));
    case "skills":
      return ResumeAi.aiTailorSkillsToJob(userId, toTailorJobSkillsInput(body));
    case "experience":
      return ResumeAi.aiTailorExperienceToJob(userId, toTailorJobExperienceInput(body));
    default: {
      const _exhaustive: never = body;
      return _exhaustive;
    }
  }
}

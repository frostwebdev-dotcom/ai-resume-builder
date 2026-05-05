import { RESUME_AI_SYSTEM_RULES } from "@/services/ai/prompts/system-base";

/** Stable ids for logging, metrics, and future A/B tests. */
export const AI_OPERATION_IDS = {
  SUMMARY_GENERATE: "summary.generate",
  SUMMARY_TAILOR: "summary.tailor",
  SUMMARY_SHORTEN: "summary.shorten",
  SUMMARY_EXPAND: "summary.expand",
  SUMMARY_GRAMMAR: "summary.grammar",
  EXPERIENCE_REWRITE_BULLETS: "experience.rewrite_bullets",
  EXPERIENCE_STRENGTHEN: "experience.strengthen",
  EXPERIENCE_SHORTEN: "experience.shorten",
  EXPERIENCE_EXPAND: "experience.expand",
  SKILLS_REPHRASE: "skills.rephrase",
  SKILLS_SHORTEN: "skills.shorten",
  CONTENT_GRAMMAR: "content.grammar",
  SUMMARY_TAILOR_JOB: "summary.tailor_job",
  SKILLS_TAILOR_JOB: "skills.tailor_job",
  EXPERIENCE_TAILOR_JOB: "experience.tailor_job",
  EDUCATION_POLISH_DETAILS: "education.polish_details",
} as const;

export type AiOperationId = (typeof AI_OPERATION_IDS)[keyof typeof AI_OPERATION_IDS];

type RegistryEntry = {
  version: string;
  description: string;
};

export const PROMPT_REGISTRY: Record<AiOperationId, RegistryEntry> = {
  [AI_OPERATION_IDS.SUMMARY_GENERATE]: {
    version: "1.0.0",
    description: "Draft headline + summary from user bullets",
  },
  [AI_OPERATION_IDS.SUMMARY_TAILOR]: {
    version: "1.0.0",
    description: "Align summary to target role",
  },
  [AI_OPERATION_IDS.SUMMARY_SHORTEN]: {
    version: "1.0.0",
    description: "Reduce length of summary",
  },
  [AI_OPERATION_IDS.SUMMARY_EXPAND]: {
    version: "1.0.0",
    description: "Expand summary with user facts only",
  },
  [AI_OPERATION_IDS.SUMMARY_GRAMMAR]: {
    version: "1.0.0",
    description: "Fix grammar and clarity in summary",
  },
  [AI_OPERATION_IDS.EXPERIENCE_REWRITE_BULLETS]: {
    version: "1.0.0",
    description: "Rewrite bullet lines for clarity",
  },
  [AI_OPERATION_IDS.EXPERIENCE_STRENGTHEN]: {
    version: "1.0.0",
    description: "Strengthen achievement emphasis",
  },
  [AI_OPERATION_IDS.EXPERIENCE_SHORTEN]: {
    version: "1.0.0",
    description: "Shorten bullets",
  },
  [AI_OPERATION_IDS.EXPERIENCE_EXPAND]: {
    version: "1.0.0",
    description: "Expand bullets using only user facts",
  },
  [AI_OPERATION_IDS.SKILLS_REPHRASE]: {
    version: "1.0.0",
    description: "Improve skills list phrasing",
  },
  [AI_OPERATION_IDS.SKILLS_SHORTEN]: {
    version: "1.0.0",
    description: "Condense skills list",
  },
  [AI_OPERATION_IDS.CONTENT_GRAMMAR]: {
    version: "1.0.0",
    description: "Grammar and clarity for free text",
  },
  [AI_OPERATION_IDS.SUMMARY_TAILOR_JOB]: {
    version: "1.0.0",
    description: "Align headline+summary to pasted job description",
  },
  [AI_OPERATION_IDS.SKILLS_TAILOR_JOB]: {
    version: "1.0.0",
    description: "Reorder and tune skills for a specific job posting",
  },
  [AI_OPERATION_IDS.EXPERIENCE_TAILOR_JOB]: {
    version: "1.0.0",
    description: "Tune bullets toward job requirements without inventing facts",
  },
  [AI_OPERATION_IDS.EDUCATION_POLISH_DETAILS]: {
    version: "1.0.0",
    description: "Polish education details using school/degree/field context only",
  },
};

export function buildSystemPrompt(operationId: AiOperationId): string {
  const meta = PROMPT_REGISTRY[operationId];
  return `${RESUME_AI_SYSTEM_RULES}

Operation: ${operationId}
Prompt bundle version: ${meta.version}`;
}

import { RESUME_AI_SYSTEM_RULES } from "@/services/ai/prompts/system-base";
import { RESUME_IMPORT_PARSE_RULES } from "@/services/ai/prompts/resume-import-rules";

/** Stable ids for logging, metrics, and future A/B tests. */
export const AI_OPERATION_IDS = {
  SUMMARY_GENERATE: "summary.generate",
  SUMMARY_TAILOR: "summary.tailor",
  SUMMARY_SHORTEN: "summary.shorten",
  SUMMARY_EXPAND: "summary.expand",
  SUMMARY_GRAMMAR: "summary.grammar",
  SUMMARY_IMPROVE: "summary.improve",
  SUMMARY_PROFESSIONAL: "summary.professional",
  EXPERIENCE_REWRITE_BULLETS: "experience.rewrite_bullets",
  EXPERIENCE_STRENGTHEN: "experience.strengthen",
  EXPERIENCE_SHORTEN: "experience.shorten",
  EXPERIENCE_EXPAND: "experience.expand",
  EXPERIENCE_BULLET_ASSIST: "experience.bullet_assist",
  SKILLS_REPHRASE: "skills.rephrase",
  SKILLS_SHORTEN: "skills.shorten",
  CONTENT_GRAMMAR: "content.grammar",
  SUMMARY_TAILOR_JOB: "summary.tailor_job",
  SKILLS_TAILOR_JOB: "skills.tailor_job",
  EXPERIENCE_TAILOR_JOB: "experience.tailor_job",
  EDUCATION_POLISH_DETAILS: "education.polish_details",
  RESUME_IMPORT_PARSE: "resume.import_parse",
  RESUME_SCORE: "resume.score",
  JOB_TAILOR_REVIEW: "job.tailor_review",
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
  [AI_OPERATION_IDS.SUMMARY_IMPROVE]: {
    version: "1.0.0",
    description: "Improve summary clarity and flow without new facts",
  },
  [AI_OPERATION_IDS.SUMMARY_PROFESSIONAL]: {
    version: "1.0.0",
    description: "Polish tone to executive professional level",
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
  [AI_OPERATION_IDS.EXPERIENCE_BULLET_ASSIST]: {
    version: "1.0.0",
    description: "Single-bullet assist (rewrite, tone, impact, concise, grammar) with optional note",
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
  [AI_OPERATION_IDS.RESUME_IMPORT_PARSE]: {
    version: "1.0.0",
    description: "Map extracted resume file text into structured wizard JSON",
  },
  [AI_OPERATION_IDS.RESUME_SCORE]: {
    version: "1.1.0",
    description:
      "Holistic resume review: score, strengths, improvements, section feedback, ATS-friendly formatting notes (non-guarantee), missing-info warnings",
  },
  [AI_OPERATION_IDS.JOB_TAILOR_REVIEW]: {
    version: "1.0.0",
    description:
      "Compare resume snapshot to a job posting: alignment highlights and honest improvement ideas without inventing facts",
  },
};

export function buildSystemPrompt(operationId: AiOperationId): string {
  const meta = PROMPT_REGISTRY[operationId];
  const importBlock =
    operationId === AI_OPERATION_IDS.RESUME_IMPORT_PARSE
      ? `\n\n${RESUME_IMPORT_PARSE_RULES}`
      : "";
  return `${RESUME_AI_SYSTEM_RULES}${importBlock}

Operation: ${operationId}
Prompt bundle version: ${meta.version}`;
}

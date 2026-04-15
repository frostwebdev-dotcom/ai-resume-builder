const JSON_ONLY = `Return a single JSON object only, no markdown.`;

export function userMessageSummaryGenerate(input: {
  headline: string;
  existingSummary: string;
  notes?: string;
}): string {
  return `${JSON_ONLY}
Schema: { "headline": string, "summary": string }

Task: Write a professional headline (one line) and a 3–5 sentence summary for a resume.
Use ONLY facts implied by the fields below. If a field is empty, write a neutral summary inviting the user to add experience details — do not invent employers or metrics.

Current headline (may be empty):
${input.headline || "(empty)"}

Current summary draft (may be empty):
${input.existingSummary || "(empty)"}

Extra notes from user (may be empty):
${input.notes ?? "(empty)"}`;
}

export function userMessageSummaryTailor(input: {
  headline: string;
  summary: string;
  targetRole: string;
  jobFocus?: string;
}): string {
  return `${JSON_ONLY}
Schema: { "headline": string, "summary": string }

Task: Rewrite the headline and summary to align with the target role. Keep facts from the user's text; do not add employers, dates, or metrics they did not provide. Emphasize relevance to the target role.

Target role / job title:
${input.targetRole}

Optional job description or keywords:
${input.jobFocus ?? "(none)"}

Current headline:
${input.headline}

Current summary:
${input.summary}`;
}

export function userMessageSummaryShorten(input: {
  headline: string;
  summary: string;
}): string {
  return `${JSON_ONLY}
Schema: { "headline": string, "summary": string }

Task: Shorten the headline and summary while preserving meaning. Do not add new facts.

Current headline:
${input.headline}

Current summary:
${input.summary}`;
}

export function userMessageSummaryExpand(input: {
  headline: string;
  summary: string;
}): string {
  return `${JSON_ONLY}
Schema: { "headline": string, "summary": string }

Task: Expand slightly for clarity and impact using ONLY information already present. Do not invent employers, tools, or metrics.

Current headline:
${input.headline}

Current summary:
${input.summary}`;
}

export function userMessageSummaryGrammar(input: {
  headline: string;
  summary: string;
}): string {
  return `${JSON_ONLY}
Schema: { "headline": string, "summary": string }

Task: Fix grammar, spelling, and clarity. Preserve meaning; do not add new claims.

Current headline:
${input.headline}

Current summary:
${input.summary}`;
}

export function userMessageExperienceBullets(input: {
  company: string;
  title: string;
  bullets: string[];
}): string {
  const lines = input.bullets.map((b, i) => `${i + 1}. ${b}`).join("\n");
  return `${JSON_ONLY}
Schema: { "bullets": string[] }

Task: Rewrite bullet points for clarity and impact. Keep the same approximate count (${input.bullets.length} bullets). Preserve facts; improve wording only.

Role: ${input.title} at ${input.company}

Bullets:
${lines}`;
}

export function userMessageExperienceStrengthen(input: {
  company: string;
  title: string;
  bullets: string[];
}): string {
  const lines = input.bullets.map((b, i) => `${i + 1}. ${b}`).join("\n");
  return `${JSON_ONLY}
Schema: { "bullets": string[] }

Task: Strengthen achievement language (action verbs, outcomes the user already hinted at). Do NOT invent metrics. Same bullet count: ${input.bullets.length}.

Role: ${input.title} at ${input.company}

Bullets:
${lines}`;
}

export function userMessageExperienceShorten(input: {
  company: string;
  title: string;
  bullets: string[];
}): string {
  const lines = input.bullets.map((b, i) => `${i + 1}. ${b}`).join("\n");
  return `${JSON_ONLY}
Schema: { "bullets": string[] }

Task: Make each bullet shorter while keeping meaning. Same number of bullets: ${input.bullets.length}.

Role: ${input.title} at ${input.company}

Bullets:
${lines}`;
}

export function userMessageExperienceExpand(input: {
  company: string;
  title: string;
  bullets: string[];
}): string {
  const lines = input.bullets.map((b, i) => `${i + 1}. ${b}`).join("\n");
  return `${JSON_ONLY}
Schema: { "bullets": string[] }

Task: Clarify and expand bullets using only details implied by the user's text. Same bullet count: ${input.bullets.length}. No invented employers or metrics.

Role: ${input.title} at ${input.company}

Bullets:
${lines}`;
}

export function userMessageSkillsRephrase(input: { lines: string }): string {
  return `${JSON_ONLY}
Schema: { "lines": string }

Task: Improve phrasing of this skills list. One skill per line in the output string (use newline characters). Do not add skills not mentioned in the input.

Input (one per line):
${input.lines}`;
}

export function userMessageSkillsShorten(input: { lines: string }): string {
  return `${JSON_ONLY}
Schema: { "lines": string }

Task: Condense the list — merge duplicates and shorten wording. Keep one skill per line. Do not add new skills.

Input:
${input.lines}`;
}

export function userMessageGrammar(input: { text: string }): string {
  return `${JSON_ONLY}
Schema: { "text": string }

Task: Fix grammar, spelling, and clarity. Preserve meaning.

Text:
${input.text}`;
}

export function userMessageSummaryTailorToJob(input: {
  jobTitle: string | null;
  company: string | null;
  jobDescription: string;
  headline: string;
  summary: string;
}): string {
  return `${JSON_ONLY}
Schema: { "headline": string, "summary": string }

Task: Rewrite the headline and professional summary so they align with the job posting below. Use ONLY facts and themes present in the candidate's current headline and summary. Do not invent employers, dates, certifications, or metrics. Mirror important language from the posting where it honestly reflects the candidate's stated experience.

Job title (may be empty):
${input.jobTitle ?? "(not specified)"}

Company (may be empty):
${input.company ?? "(not specified)"}

Job posting:
---
${input.jobDescription}
---

Current resume headline:
${input.headline || "(empty)"}

Current resume summary:
${input.summary || "(empty)"}`;
}

export function userMessageSkillsTailorToJob(input: {
  jobTitle: string | null;
  company: string | null;
  jobDescription: string;
  lines: string;
}): string {
  return `${JSON_ONLY}
Schema: { "lines": string }

Task: Reorder and lightly rephrase the skills list so it aligns with the job posting. Output one skill per line (newline-separated string). Do not add skills the user did not list or clearly imply. You may merge duplicates.

Job posting excerpt (for context):
---
${input.jobDescription.slice(0, 6000)}${input.jobDescription.length > 6000 ? "\n... (truncated)" : ""}
---

Skills list (one per line):
${input.lines || "(empty)"}`;
}

export function userMessageExperienceTailorToJob(input: {
  jobTitle: string | null;
  company: string | null;
  jobDescription: string;
  roleTitle: string;
  employer: string;
  bullets: string[];
}): string {
  const lines = input.bullets.map((b, i) => `${i + 1}. ${b}`).join("\n");
  return `${JSON_ONLY}
Schema: { "bullets": string[] }

Task: Rewrite these resume bullets to emphasize relevance to the job posting. Keep the same number of bullets. Preserve all factual claims — do not add employers, products, dates, or metrics that are not already implied by the bullet text. You may reorder bullets.

Job posting excerpt:
---
${input.jobDescription.slice(0, 6000)}${input.jobDescription.length > 6000 ? "\n... (truncated)" : ""}
---

Position on resume: ${input.roleTitle} at ${input.employer}

Bullets:
${lines}`;
}

const JSON_ONLY = `Return a single JSON object only, no markdown.`;

export function userMessageSummaryGenerate(input: {
  headline: string;
  existingSummary: string;
  notes?: string;
}): string {
  return `${JSON_ONLY}
Schema: { "headline": string, "summary": string }

Task: Write a professional headline (one line) and a **2–4 sentence** professional summary (each sentence reasonably short — aim for a compact paragraph, not a long essay).
Use ONLY facts implied by the fields below (including the resume context section). Lead with the strongest themes the user already named (roles, domains, tools they mentioned). If a **Target role** appears in the resume context, align headline and summary to that role without inventing employers, metrics, degrees, or dates. Prefer active voice and concrete nouns; avoid filler. If fields are empty, write a concise neutral headline and 2 short sentences inviting them to add experience — do not invent employers, metrics, or degrees.

Current headline (may be empty):
${input.headline || "(empty)"}

Current summary draft (may be empty):
${input.existingSummary || "(empty)"}

Resume context (may include target role, experience bullets, skills — use only as factual grounding; do not fabricate details not implied here):
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

Task: Shorten the headline and summary while preserving meaning. Prefer a summary of **2–4 tight lines** (roughly 2–4 short sentences). Do not add new facts.

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

export function userMessageSummaryImprove(input: {
  headline: string;
  summary: string;
  targetRoleHint?: string;
}): string {
  return `${JSON_ONLY}
Schema: { "headline": string, "summary": string }

Task: Improve clarity, flow, and impact of the headline and summary using ONLY facts already present. Prefer strong action verbs and parallel structure. Keep the summary to **2–4 sentences** (concise paragraph). Do not add employers, job titles, degrees, dates, metrics, or tools that are not already implied by the text below.
${input.targetRoleHint?.trim() ? `Prioritize alignment with this target direction (without inventing experience): ${input.targetRoleHint.trim()}` : ""}

Current headline:
${input.headline || "(empty)"}

Current summary:
${input.summary || "(empty)"}`;
}

export function userMessageSummaryProfessional(input: {
  headline: string;
  summary: string;
  targetRoleHint?: string;
}): string {
  return `${JSON_ONLY}
Schema: { "headline": string, "summary": string }

Task: Rewrite for a polished, professional executive tone while preserving every factual claim. Same or fewer words where possible. Summary must be **2–4 sentences**, no hype. Do not invent employers, metrics, certifications, or dates.
${input.targetRoleHint?.trim() ? `Subtly orient language toward: ${input.targetRoleHint.trim()} — still only using facts from the current text.` : ""}

Current headline:
${input.headline || "(empty)"}

Current summary:
${input.summary || "(empty)"}`;
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

export function userMessageEducationPolishDetails(input: {
  school: string;
  degree: string;
  field: string;
  details: string;
}): string {
  return `${JSON_ONLY}
Schema: { "details": string }

Task: Return ONLY an improved "details" paragraph for this education entry (honors, coursework, thesis, relevant projects, GPA only if the user already wrote it). Use school, degree, and field as context — do not change or invent institution names, degree titles, or dates. If details are empty but school and degree are present, write 1–3 short factual sentences grounded only in degree + field + school (e.g. area of study); do not invent GPA, awards, or clubs. If all fields are empty, return an empty string for details.

School:
${input.school || "(empty)"}

Degree:
${input.degree || "(empty)"}

Field of study:
${input.field || "(empty)"}

Current details (may be empty):
${input.details || "(empty)"}`;
}

export function userMessageResumeScore(input: { resumeText: string }): string {
  return `${JSON_ONLY}
Schema: {
  "overallScore": number,
  "summary": { "score": number, "feedback": string },
  "experience": { "score": number, "feedback": string },
  "skills": { "score": number, "feedback": string },
  "ats": { "score": number, "feedback": string },
  "topActions": string[]
}

Task: Score this resume snapshot on four dimensions (each 0–100) plus an overall score (0–100). Base scores only on what appears in the text — do not reward invented employers, metrics, or degrees. Feedback must be concise (2–4 short sentences per dimension), actionable, and use professional language. Prefer action verbs and concrete suggestions; where metrics are missing, mention placeholders like [X%] or [number] as optional improvements, not as facts.

topActions: up to 8 short imperative tips (e.g. "Quantify impact in second bullet under DataCorp").

Resume snapshot:
---
${input.resumeText}
---`;
}

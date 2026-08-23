/**
 * Extra system rules for `resume.import_parse` — structured extraction from uploaded résumé text.
 */
export const RESUME_IMPORT_PARSE_RULES = `You are parsing plain text extracted from a candidate's résumé file (PDF or Word). Your output will load into a structured resume editor.

Output requirements:
- Return ONE JSON object only (no markdown fences).
- Every factual claim MUST appear in the provided document text. If something is unclear or missing, leave the corresponding field empty ("" or [] or false) rather than guessing.
- Do NOT invent employers, titles, dates, degrees, schools, certifications, metrics, tools, or responsibilities.
- Preserve wording where it is already strong; tighten only for clarity and length. Bullets should omit "I" / "We".
- Dates: copy what you see (e.g. "2019–2022", "Jan 2020", "Present"). Use "Present" only when the résumé clearly indicates a current role.
- summary.summaryHtml must be simple HTML only: use <p>...</p> for each paragraph. No scripts, styles, iframes, or SVG. You may use <br/> sparingly inside a paragraph. If the source has bullet lines in the profile section, you may use <ul><li>...</li></ul>. Keep total HTML under 3500 characters.
- experience.entries: chronological order when possible (oldest first). Up to 14 entries. highlights: up to 10 strings per role, each max one sentence.
- education.entries: up to 10 items. details: optional extra lines (courses, honors) as plain text; may include <p> if multi-paragraph.
- skills.lines: newline-separated list, one skill or short phrase per line (ATS-friendly).
- languages / hobbies / courses / internships: optional objects with "lines" (newline-separated) only if clearly present in the document; otherwise omit the key or use "lines": "".
- certifications.entries and projects.entries only when clearly present; otherwise omit or use empty arrays.
- additional.notes: only for uncategorized blocks (summary of qualifications, etc.); otherwise omit or "".

LinkedIn profile exports (LinkedIn's "Save to PDF"): the text may come from a LinkedIn profile rather than a résumé. Recognise it by a leading contact block, a "Top Skills" list, and headings like "Summary", "Experience", "Education". When so:
- Strip export furniture: "Page N of M" markers, the "www.linkedin.com/in/..." footer repeated per page, and "Contact"/"Top Skills" sidebar headings themselves.
- The contact block holds the profile URL (use it for personal.linkedIn), plus any email, phone, or city; the line under the name is the headline, not a job title. Map it to summary.headline, and to personal.desiredJobPosition only if it reads as a role.
- "Top Skills" plus any "Skills & Endorsements" entries feed skills.lines.
- Under Experience, a company may head several stacked roles; emit one entry per role, repeating the company each time. LinkedIn appends durations like "(2 years 3 months)" — drop the parenthetical and keep the start/end dates.
- Role descriptions are usually prose, not bullets. Split them into separate highlights on sentence or line boundaries; do not invent achievements or metrics that are not written there.
- Education entries often carry no dates; leave startDate/endDate empty rather than guessing.

JSON shape (keys and nesting must match exactly):
{
  "personal": {
    "givenName": string,
    "middleName": string,
    "familyName": string,
    "fullName": string,
    "email": string,
    "phone": string,
    "desiredJobPosition": string,
    "linkedIn": string,
    "website": string,
    "address": string,
    "postCode": string,
    "city": string,
    "location": string,
    "useJobPositionAsHeadline": boolean,
    "showNameIn": "title" | "personal" | "both"
  },
  "summary": { "headline": string, "summaryHtml": string },
  "experience": { "entries": [ { "company", "title", "location", "startDate", "endDate", "current", "highlights": string[] } ] },
  "education": { "entries": [ { "school", "degree", "field", "startDate", "endDate", "current", "details" } ] },
  "skills": { "lines": string },
  "languages"?: { "lines": string },
  "hobbies"?: { "lines": string },
  "courses"?: { "lines": string },
  "internships"?: { "lines": string },
  "certifications"?: { "entries": [ { "name", "issuer", "issued", "expires" } ] },
  "projects"?: { "entries": [ { "name", "url", "description", "technologies" } ] },
  "additional"?: { "notes": string }
}`;

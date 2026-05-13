import type { WizardStateV1 } from "@/lib/resume-wizard/types";

/**
 * Compact resume facts for summary generation (no invented employers).
 * Kept under AI notes budget.
 */
export function buildSummaryGenerationNotes(state: WizardStateV1): string {
  const parts: string[] = [];
  const target = state.personal.desiredJobPosition.trim();
  if (target) {
    parts.push(`Target role (from resume): ${target}`);
  }
  if (state.personal.useJobPositionAsHeadline && target) {
    parts.push("Headline is synced to target role when editing personal details.");
  }

  const exp = state.experience.entries.slice(0, 8);
  if (exp.length) {
    parts.push("Experience (titles, employers, bullet text only — do not invent new employers):");
    for (const e of exp) {
      const title = e.title.trim() || "(role)";
      const company = e.company.trim() || "(employer)";
      const hs = e.highlights.filter((b) => b.trim()).slice(0, 5);
      if (hs.length === 0) {
        parts.push(`- ${title} @ ${company}`);
      } else {
        for (const h of hs) {
          parts.push(`- ${title} @ ${company}: ${h}`);
        }
      }
    }
  }

  const skills = state.skills.lines.trim();
  if (skills) {
    parts.push(`Skills / tools (from resume):\n${skills.slice(0, 2000)}`);
  }

  const edu = state.education.entries
    .filter((x) => x.school.trim() || x.degree.trim())
    .slice(0, 4)
    .map((x) => `${x.degree} ${x.field} — ${x.school}`.trim());
  if (edu.length) {
    parts.push(`Education (from resume):\n${edu.join("\n")}`);
  }

  const certs = state.certifications.entries
    .filter((c) => c.name.trim())
    .slice(0, 8)
    .map((c) => `${c.name}${c.issuer ? ` (${c.issuer})` : ""}`);
  if (certs.length) {
    parts.push(`Certifications (from resume):\n${certs.join("\n")}`);
  }

  let text = parts.join("\n\n");
  if (text.length > 7800) {
    text = `${text.slice(0, 7800)}\n\n… (context truncated)`;
  }
  return text;
}

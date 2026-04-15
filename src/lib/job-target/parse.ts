import type { Json } from "@/types/database";

import type { TailoringCompareV1 } from "@/lib/job-target/types";

export function parseTailoringCompare(raw: unknown): TailoringCompareV1 | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  if (o.v !== 1) return null;
  return raw as TailoringCompareV1;
}

export function mergeTailoringCompare(
  existingMeta: Json,
  patch: Partial<TailoringCompareV1>,
): Json {
  const base =
    existingMeta && typeof existingMeta === "object" && !Array.isArray(existingMeta)
      ? (existingMeta as Record<string, unknown>)
      : {};
  const prev = parseTailoringCompare(base.tailoring_compare);
  const next: TailoringCompareV1 = {
    v: 1,
    summary: patch.summary ?? prev?.summary,
    skills: patch.skills ?? prev?.skills,
    experience: {
      ...(prev?.experience ?? {}),
      ...(patch.experience ?? {}),
    },
  };
  return { ...base, tailoring_compare: next } as Json;
}

export function clearTailoringSection(
  existingMeta: Json,
  section: "summary" | "skills",
): Json;
export function clearTailoringSection(
  existingMeta: Json,
  section: "experience",
  entryId: string,
): Json;
export function clearTailoringSection(
  existingMeta: Json,
  section: "summary" | "skills" | "experience",
  entryId?: string,
): Json {
  const base =
    existingMeta && typeof existingMeta === "object" && !Array.isArray(existingMeta)
      ? (existingMeta as Record<string, unknown>)
      : {};
  const prev = parseTailoringCompare(base.tailoring_compare);
  if (!prev) return existingMeta;
  const next: TailoringCompareV1 = { ...prev, v: 1 };
  if (section === "summary") delete next.summary;
  if (section === "skills") delete next.skills;
  if (section === "experience" && entryId && next.experience) {
    const { [entryId]: _, ...rest } = next.experience;
    void _;
    next.experience = Object.keys(rest).length > 0 ? rest : undefined;
  }
  return { ...base, tailoring_compare: next } as Json;
}

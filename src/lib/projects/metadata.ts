import type { Json } from "@/types/database";

export type ResumeProjectMetadata = {
  /** User marked the resume ready to preview in the product (independent of DB `status`). */
  ready_for_preview?: boolean;
};

export function parseProjectMetadata(raw: Json): ResumeProjectMetadata {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  const o = raw as Record<string, unknown>;
  return {
    ready_for_preview: o.ready_for_preview === true,
  };
}

export function mergeProjectMetadata(
  existing: Json,
  patch: Partial<ResumeProjectMetadata>,
): Json {
  const base =
    existing && typeof existing === "object" && !Array.isArray(existing)
      ? (existing as Record<string, unknown>)
      : {};
  return { ...base, ...patch } as Json;
}

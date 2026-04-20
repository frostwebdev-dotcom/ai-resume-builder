import type { Json } from "@/types/database";
import type { ResumeStyleV1 } from "@/lib/resume-preview/resume-style";
import { resumeStyleV1Schema } from "@/validation/resume-style";

export type ResumeProjectMetadata = {
  /** User marked the resume ready to preview in the product (independent of DB `status`). */
  ready_for_preview?: boolean;
  /** Optional resume appearance overrides (colors, type, spacing). */
  resume_style?: ResumeStyleV1;
  /**
   * Storage object key inside the private `avatars` bucket.
   * Convention: `{user_id}/{project_id}/{object_uuid}.{ext}`.
   * Null or absent = no avatar uploaded for this project.
   */
  avatar_path?: string | null;
};

function isStorageAvatarPath(value: unknown): value is string {
  if (typeof value !== "string") return false;
  if (value.length === 0 || value.length > 512) return false;
  // Reject any attempt at escape or absolute paths.
  if (value.startsWith("/") || value.includes("..")) return false;
  // Accept only the safe "uid/pid/file.ext" shape.
  return /^[0-9a-zA-Z._\-/]+$/.test(value);
}

export function parseProjectMetadata(raw: Json): ResumeProjectMetadata {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  const o = raw as Record<string, unknown>;
  let resume_style: ResumeStyleV1 | undefined;
  const parsedStyle = resumeStyleV1Schema.safeParse(o.resume_style);
  if (parsedStyle.success) {
    resume_style = parsedStyle.data;
  }
  const avatar_path = isStorageAvatarPath(o.avatar_path) ? o.avatar_path : null;
  return {
    ready_for_preview: o.ready_for_preview === true,
    resume_style,
    avatar_path,
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

/**
 * Avatar constants shared between the client UI and server actions.
 * Must NOT import server-only modules — this file is imported by
 * "use client" components.
 */
export const AVATAR_BUCKET = "avatars";
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/webp"]);

export function avatarExtensionFor(mime: string): "png" | "jpg" | "webp" | null {
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/webp") return "webp";
  return null;
}

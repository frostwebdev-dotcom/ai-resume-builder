import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  AVATAR_ALLOWED_MIME,
  AVATAR_BUCKET,
  AVATAR_MAX_BYTES,
  avatarExtensionFor,
} from "@/lib/avatars/constants";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import type { Database } from "@/types/database";

// Re-export the shared constants so existing server imports keep working.
export { AVATAR_ALLOWED_MIME, AVATAR_BUCKET, AVATAR_MAX_BYTES, avatarExtensionFor };

type SB = SupabaseClient<Database>;

/**
 * Ensure an object key belongs to `{userId}/{projectId}/…`. Defends against a
 * compromised metadata row referencing a path outside the caller's prefix.
 */
export function isAvatarPathOwnedBy(path: string, userId: string, projectId: string): boolean {
  const prefix = `${userId}/${projectId}/`;
  return path.startsWith(prefix) && !path.includes("..");
}

/**
 * Create a short-lived signed URL for rendering an avatar in the browser.
 * Preview pages embed this directly in <img src>.
 */
export async function createSignedAvatarUrl(
  service: SB,
  path: string,
  ttlSeconds = 60 * 10,
): Promise<string | null> {
  const { data, error } = await service.storage
    .from(AVATAR_BUCKET)
    .createSignedUrl(path, ttlSeconds);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

/**
 * Download the avatar bytes (used for PDF export — PDFKit needs a Buffer).
 */
export async function downloadAvatarBuffer(
  service: SB,
  path: string,
): Promise<{ buffer: Buffer; contentType: string } | null> {
  const { data, error } = await service.storage.from(AVATAR_BUCKET).download(path);
  if (error || !data) return null;
  const arrayBuffer = await data.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    contentType: data.type || "image/jpeg",
  };
}

export async function removeAvatarObject(service: SB, path: string): Promise<void> {
  // Fire-and-forget: log but don't block the caller on cleanup failure.
  const { error } = await service.storage.from(AVATAR_BUCKET).remove([path]);
  if (error) {
    console.warn("[avatars] remove failed", { path, message: error.message });
  }
}

/** Convenience for server actions where a fresh service client is acceptable. */
export function getAvatarService(): SB {
  return createSupabaseServiceRoleClient();
}

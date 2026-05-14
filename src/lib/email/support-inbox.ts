import "server-only";

import { clientEnv } from "@/lib/env";

/** Marketing / transactional footers — same as `NEXT_PUBLIC_CONTACT_EMAIL` on the contact page. */
export function getPublicSupportEmailDisplay(): string | null {
  return clientEnv.NEXT_PUBLIC_CONTACT_EMAIL?.trim() ?? null;
}

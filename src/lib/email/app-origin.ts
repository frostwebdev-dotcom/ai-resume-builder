import "server-only";

import { clientEnv } from "@/lib/env";

/** Absolute URL for email links (no trailing slash on origin). */
export function appOrigin(): string {
  return clientEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
}

export function appAbsoluteUrl(path: string): string {
  const base = appOrigin();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

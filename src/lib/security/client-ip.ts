import "server-only";

import { headers } from "next/headers";

const MAX_LEN = 64;

/**
 * Best-effort client IP for rate limiting (Vercel, Cloudflare, generic proxies).
 * Not used for security guarantees alone — combine with auth and rate limits.
 */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return sanitizeIpToken(first);
  }
  const realIp = h.get("x-real-ip") ?? h.get("cf-connecting-ip");
  if (realIp) return sanitizeIpToken(realIp.trim());
  return "unknown";
}

function sanitizeIpToken(raw: string): string {
  const s = raw.slice(0, MAX_LEN);
  if (/^[\d.a-fA-F:]+$/.test(s) || s === "unknown") return s;
  return s.replace(/[^\w.:+\-[\]]/g, "").slice(0, MAX_LEN) || "unknown";
}

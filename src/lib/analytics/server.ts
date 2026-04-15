import "server-only";

import type { AnalyticsEventName } from "@/lib/analytics/events";
import { serverEnv } from "@/lib/env";

type SafeProps = Record<string, string | number | boolean>;

const MAX_KEY = 64;
const MAX_STR = 240;

/**
 * Server-side product analytics — structured JSON logs for aggregators (Datadog, Axiom, etc.).
 * Forwards to external providers via `forwardAnalyticsEvent` when configured.
 * Never log PII; truncate long strings.
 */
export function trackServerEvent(name: AnalyticsEventName, props?: Record<string, unknown>): void {
  try {
    const safe = sanitizeProps(props);
    const line = JSON.stringify({
      type: "analytics_event",
      event: name,
      source: "server",
      ts: new Date().toISOString(),
      ...(safe ? { props: safe } : {}),
    });
    console.info(line);
    void forwardAnalyticsEvent(name, safe);
  } catch {
    // Never break user flows
  }
}

function sanitizeProps(props?: Record<string, unknown>): SafeProps | undefined {
  if (!props) return undefined;
  const out: SafeProps = {};
  for (const [k, v] of Object.entries(props)) {
    const key = k.slice(0, MAX_KEY);
    if (v === undefined || v === null) continue;
    if (typeof v === "boolean" || typeof v === "number") {
      if (Number.isFinite(v) || typeof v === "boolean") out[key] = v;
      continue;
    }
    if (typeof v === "string") {
      out[key] = v.length > MAX_STR ? `${v.slice(0, MAX_STR)}…` : v;
    }
  }
  return Object.keys(out).length ? out : undefined;
}

/** Optional HTTP sink for BI tools (set `ANALYTICS_WEBHOOK_URL`). */
async function forwardAnalyticsEvent(name: AnalyticsEventName, props: SafeProps | undefined): Promise<void> {
  const url = serverEnv.ANALYTICS_WEBHOOK_URL;
  if (!url) return;
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 4000);
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: name, props, ts: new Date().toISOString() }),
      signal: ac.signal,
    });
  } catch {
    // optional sink
  } finally {
    clearTimeout(t);
  }
}

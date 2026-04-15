"use client";

import type { AnalyticsEventName } from "@/lib/analytics/events";

function isAnalyticsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ANALYTICS_ENABLED !== "false";
}

/**
 * Browser analytics — sendBeacon to same-origin ingest (privacy-safe props only).
 */
export function trackClientEvent(
  event: AnalyticsEventName,
  props?: Record<string, string | number | boolean | null>,
): void {
  if (typeof window === "undefined") return;
  if (!isAnalyticsEnabled()) return;

  const cleaned: Record<string, string | number | boolean> = {};
  if (props) {
    for (const [k, v] of Object.entries(props)) {
      if (v === undefined || v === null) continue;
      cleaned[k] = v;
    }
  }

  const body = JSON.stringify({
    event,
    props: Object.keys(cleaned).length ? cleaned : undefined,
    client_ts: Date.now(),
  });

  try {
    const blob = new Blob([body], { type: "application/json" });
    if (navigator.sendBeacon("/api/analytics/event", blob)) {
      return;
    }
    void fetch("/api/analytics/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    });
  } catch {
    // ignore
  }
}

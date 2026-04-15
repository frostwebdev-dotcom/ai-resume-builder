import { NextResponse, type NextRequest } from "next/server";

import { inboundAnalyticsEventSchema } from "@/lib/analytics/validate-event";

export const runtime = "nodejs";

/**
 * Ingests browser analytics (sendBeacon / fetch). Same structured log line as `trackServerEvent`.
 */
export async function POST(request: NextRequest) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = inboundAnalyticsEventSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
  }

  const { event, props, client_ts } = parsed.data;
  const line = JSON.stringify({
    type: "analytics_event",
    event,
    source: "client",
    ts: new Date().toISOString(),
    client_ts,
    ...(props && Object.keys(props).length ? { props } : {}),
  });
  console.info(line);

  return new NextResponse(null, { status: 204 });
}

import { NextResponse } from "next/server";

import { guestAiUserKey, isGuestAiProjectId } from "@/lib/ai/guest";
import { getSessionUser } from "@/lib/auth/session";

export type AiErrorBody = { ok: false; error: string; code?: string; details?: unknown };

export async function requireSessionUser(): Promise<
  | { ok: true; userId: string }
  | { ok: false; response: NextResponse<AiErrorBody> }
> {
  const user = await getSessionUser();
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "You need to be signed in to use this feature.", code: "AUTH" },
        { status: 401 },
      ),
    };
  }
  return { ok: true, userId: user.id };
}

function clientIpFromRequest(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  if (first) return first.slice(0, 64);
  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("cf-connecting-ip") ??
    "unknown"
  ).slice(0, 64);
}

export async function requireAiActorForProject(
  request: Request,
  projectId: string,
): Promise<
  | { ok: true; userId: string }
  | { ok: false; response: NextResponse<AiErrorBody> }
> {
  const user = await getSessionUser();
  if (user) return { ok: true, userId: user.id };
  if (isGuestAiProjectId(projectId)) {
    return { ok: true, userId: guestAiUserKey(clientIpFromRequest(request)) };
  }
  return {
    ok: false,
    response: NextResponse.json(
      { ok: false, error: "You need to be signed in to use this feature.", code: "AUTH" },
      { status: 401 },
    ),
  };
}

export async function readJsonBody(request: Request): Promise<unknown | NextResponse<AiErrorBody>> {
  try {
    return await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body.", code: "VALIDATION" },
      { status: 400 },
    );
  }
}

export function statusForAiCode(code?: string): number {
  switch (code) {
    case "AUTH":
      return 401;
    case "RATE_LIMIT":
      return 429;
    case "NO_AI":
      return 503;
    case "NOT_FOUND":
      return 404;
    case "PAYLOAD":
      return 413;
    case "VALIDATION":
    case "NO_JOB":
    case "JSON_PARSE":
    case "SCHEMA_MISMATCH":
    case "EMPTY_RESPONSE":
      return 400;
    default: {
      if (!code) return 500;
      const n = Number(code);
      if (Number.isFinite(n) && n >= 400 && n < 600) return n;
      return 500;
    }
  }
}

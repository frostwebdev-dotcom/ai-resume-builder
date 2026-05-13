import { NextResponse } from "next/server";

import { apiRewriteBulletBodySchema } from "@/lib/ai/schemas";
import { rewriteResumeBullet } from "@/lib/ai/resume-ai-service";

import { readJsonBody, requireSessionUser, statusForAiCode } from "../_http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await requireSessionUser();
  if (!session.ok) return session.response;

  const raw = await readJsonBody(request);
  if (raw instanceof NextResponse) return raw;

  const parsed = apiRewriteBulletBodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Check the highlighted fields and try again.",
        code: "VALIDATION",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const out = await rewriteResumeBullet(session.userId, parsed.data);
  if (!out.ok) {
    return NextResponse.json(
      { ok: false, error: out.error, code: out.code },
      { status: statusForAiCode(out.code) },
    );
  }
  return NextResponse.json({ ok: true, data: out.data });
}

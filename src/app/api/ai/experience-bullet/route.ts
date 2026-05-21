import { NextResponse } from "next/server";

import { apiExperienceBulletBodySchema } from "@/lib/ai/schemas";
import { suggestExperienceBullet } from "@/lib/ai/resume-ai-service";

import { readJsonBody, requireAiActorForProject, statusForAiCode } from "../_http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const raw = await readJsonBody(request);
  if (raw instanceof NextResponse) return raw;

  const parsed = apiExperienceBulletBodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Check project, role, and bullet fields.",
        code: "VALIDATION",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const actor = await requireAiActorForProject(request, parsed.data.projectId);
  if (!actor.ok) return actor.response;

  const out = await suggestExperienceBullet(actor.userId, parsed.data);
  if (!out.ok) {
    return NextResponse.json(
      { ok: false, error: out.error, code: out.code },
      { status: statusForAiCode(out.code) },
    );
  }
  return NextResponse.json({ ok: true, data: out.data });
}

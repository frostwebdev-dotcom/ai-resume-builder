import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "smart-resume-builder",
    timestamp: new Date().toISOString(),
  });
}

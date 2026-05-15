import { NextResponse } from "next/server";

import { runPostSignInCallbackEffects } from "@/lib/auth/post-signin-callback-effects";

/**
 * Invoked from the browser after `/auth/callback` finishes `exchangeCodeForSession` / `verifyOtp` / `setSession`,
 * so the server can run welcome email + analytics using the new session cookies.
 */
export async function POST() {
  const ok = await runPostSignInCallbackEffects();
  if (!ok) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}

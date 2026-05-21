import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCheckoutReturnState } from "@/services/billing/queries";
import { getResumeDownloadAccess } from "@/services/downloads/queries";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

type SafePaymentStatus = "pending" | "paid" | "failed" | "cancelled" | "not_found";

function jsonStatus(status: SafePaymentStatus, init?: ResponseInit) {
  return NextResponse.json({ status }, init);
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { projectId } = await context.params;
  const sessionId = request.nextUrl.searchParams.get("session_id") ?? undefined;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return jsonStatus("not_found", { status: 401 });
  }

  const { data: project, error: projectError } = await supabase
    .from("resume_projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (projectError || !project) {
    return jsonStatus("not_found", { status: 404 });
  }

  const state = await getCheckoutReturnState(user.id, projectId, sessionId);

  if (state.kind === "paid") {
    const access = await getResumeDownloadAccess(user.id, projectId);
    return jsonStatus(access.canDownload ? "paid" : "pending");
  }

  if (state.kind === "failed") {
    return jsonStatus("failed");
  }

  if (state.kind === "pending") {
    return jsonStatus("pending");
  }

  return jsonStatus("not_found", { status: 404 });
}

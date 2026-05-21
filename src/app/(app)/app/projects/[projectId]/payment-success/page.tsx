import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PaymentSuccessClient } from "@/components/billing/payment-success-client";
import { ROUTES } from "@/lib/constants";
import { getOptionalAuth, requireUser } from "@/lib/auth/guards";
import { getCheckoutReturnState } from "@/services/billing/queries";
import { getProjectDetailForUser } from "@/services/projects/queries";

export const maxDuration = 30;

type PageProps = {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ session_id?: string | string[] }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { projectId } = await params;
  const ctx = await getOptionalAuth();
  if (!ctx) return { title: "Payment success" };
  const detail = await getProjectDetailForUser(ctx.user.id, projectId);
  if (!detail) return { title: "Payment success" };
  return { title: `Payment confirmed · ${detail.project.title}` };
}

function toPaymentStatus(
  state: Awaited<ReturnType<typeof getCheckoutReturnState>>,
): "pending" | "paid" | "failed" | "cancelled" | "not_found" {
  if (state.kind === "paid") return "paid";
  if (state.kind === "failed") return "failed";
  if (state.kind === "pending") return "pending";
  return "not_found";
}

export default async function PaymentSuccessPage({ params, searchParams }: PageProps) {
  const { projectId } = await params;
  const sp = await searchParams;
  const sessionId = Array.isArray(sp.session_id) ? sp.session_id[0] : sp.session_id;

  const { user } = await requireUser({
    nextPath: `${ROUTES.app.projectPaymentSuccess(projectId)}${
      sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : ""
    }`,
  });

  const detail = await getProjectDetailForUser(user.id, projectId);
  if (!detail) {
    notFound();
  }

  const initialState = await getCheckoutReturnState(user.id, projectId, sessionId);

  return (
    <section className="min-h-full flex-1 overflow-x-clip bg-slate-50">
      <PaymentSuccessClient
        projectId={projectId}
        projectTitle={detail.project.title}
        sessionId={sessionId}
        initialStatus={toPaymentStatus(initialState)}
      />
    </section>
  );
}

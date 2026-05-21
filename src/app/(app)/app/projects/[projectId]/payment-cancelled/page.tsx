import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PaymentCancelledClient } from "@/components/billing/payment-cancelled-client";
import { ROUTES } from "@/lib/constants";
import { getOptionalAuth, requireUser } from "@/lib/auth/guards";
import { getProjectDetailForUser } from "@/services/projects/queries";

type PageProps = {
  params: Promise<{ projectId: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { projectId } = await params;
  const ctx = await getOptionalAuth();
  if (!ctx) return { title: "Payment canceled" };
  const detail = await getProjectDetailForUser(ctx.user.id, projectId);
  if (!detail) return { title: "Payment canceled" };
  return { title: `Payment canceled · ${detail.project.title}` };
}

export default async function PaymentCancelledPage({ params }: PageProps) {
  const { projectId } = await params;
  const { user } = await requireUser({
    nextPath: ROUTES.app.projectPaymentCancelled(projectId),
  });

  const detail = await getProjectDetailForUser(user.id, projectId);
  if (!detail) {
    notFound();
  }

  return (
    <section className="min-h-full flex-1 overflow-x-clip bg-slate-50">
      <PaymentCancelledClient projectId={projectId} projectTitle={detail.project.title} />
    </section>
  );
}

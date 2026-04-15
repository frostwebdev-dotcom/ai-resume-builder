import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CheckoutReturnClient } from "@/components/billing/checkout-return-client";
import { PageContainer } from "@/components/layout/page-container";
import { ROUTES } from "@/lib/constants";
import { getOptionalAuth, requireUser } from "@/lib/auth/guards";
import { getProjectDetailForUser } from "@/services/projects/queries";
import { getCheckoutReturnState } from "@/services/billing/queries";

export const maxDuration = 30;

type PageProps = {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ session_id?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { projectId } = await params;
  const ctx = await getOptionalAuth();
  if (!ctx) return { title: "Checkout" };
  const detail = await getProjectDetailForUser(ctx.user.id, projectId);
  if (!detail) return { title: "Checkout" };
  return { title: `Checkout · ${detail.project.title}` };
}

export default async function CheckoutReturnPage({ params, searchParams }: PageProps) {
  const { projectId } = await params;
  const sp = await searchParams;
  const sessionId = typeof sp.session_id === "string" ? sp.session_id : undefined;

  const { user } = await requireUser({
    nextPath: ROUTES.app.projectCheckoutReturn(projectId),
  });

  const detail = await getProjectDetailForUser(user.id, projectId);
  if (!detail) {
    notFound();
  }

  const initial = await getCheckoutReturnState(user.id, projectId, sessionId);

  return (
    <section className="min-h-0 flex-1 pt-6 pb-safe sm:py-10">
      <PageContainer className="max-w-lg">
        <CheckoutReturnClient
          projectId={projectId}
          sessionId={sessionId}
          projectTitle={detail.project.title}
          initial={initial}
        />
      </PageContainer>
    </section>
  );
}

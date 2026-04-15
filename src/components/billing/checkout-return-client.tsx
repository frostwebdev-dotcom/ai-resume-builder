"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import type { CheckoutReturnState } from "@/services/billing/queries";
import { pollCheckoutOrderStatusAction } from "@/services/billing/actions";
import { cn } from "@/lib/utils";

type Props = {
  projectId: string;
  projectTitle: string;
  sessionId: string | undefined;
  initial: CheckoutReturnState;
};

export function CheckoutReturnClient({
  projectId,
  projectTitle,
  sessionId,
  initial,
}: Props) {
  const router = useRouter();
  const attempts = useRef(0);
  const [polling, setPolling] = useState(
    () => initial.kind === "pending" && Boolean(sessionId),
  );

  useEffect(() => {
    if (!polling || !sessionId) return;

    const id = window.setInterval(async () => {
      attempts.current += 1;
      if (attempts.current > 40) {
        window.clearInterval(id);
        setPolling(false);
        return;
      }
      const r = await pollCheckoutOrderStatusAction({
        projectId,
        checkoutSessionId: sessionId,
      });
      if (!r.ok) return;
      if (r.status === "completed") {
        window.clearInterval(id);
        setPolling(false);
        router.replace(`${ROUTES.app.projectPreview(projectId)}?checkout=success`);
        router.refresh();
      } else if (r.status === "failed" || r.status === "refunded") {
        window.clearInterval(id);
        setPolling(false);
        router.replace(`${ROUTES.app.projectPreview(projectId)}?checkout=failed`);
        router.refresh();
      }
    }, 2000);

    return () => window.clearInterval(id);
  }, [polling, projectId, sessionId, router]);

  if (initial.kind === "missing_session") {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm ring-1 ring-foreground/5">
        <h1 className="text-lg font-semibold text-foreground">Missing checkout session</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Open checkout from your resume preview. This page only works right after Stripe redirects you
          back.
        </p>
        <Link
          href={ROUTES.app.projectPreview(projectId)}
          className={cn(buttonVariants({ size: "touch" }), "mt-6 inline-flex w-full justify-center")}
        >
          Back to preview
        </Link>
      </div>
    );
  }

  if (initial.kind === "not_found") {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm ring-1 ring-foreground/5">
        <h1 className="text-lg font-semibold text-foreground">Could not verify payment</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This session is not linked to your account, or it belongs to another project. If you were
          charged, contact support with your receipt.
        </p>
        <Link
          href={ROUTES.app.projectPreview(projectId)}
          className={cn(buttonVariants({ size: "touch" }), "mt-6 inline-flex w-full justify-center")}
        >
          Back to preview
        </Link>
      </div>
    );
  }

  if (initial.kind === "failed") {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 ring-1 ring-destructive/10">
        <div className="flex gap-3">
          <XCircle className="size-6 shrink-0 text-destructive" aria-hidden />
          <div>
            <h1 className="text-lg font-semibold text-foreground">Payment did not complete</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your order was not marked paid. You can try again from the preview page when you are ready.
            </p>
          </div>
        </div>
        <Link
          href={ROUTES.app.projectPreview(projectId)}
          className={cn(buttonVariants({ size: "touch" }), "mt-6 inline-flex w-full justify-center")}
        >
          Back to {projectTitle}
        </Link>
      </div>
    );
  }

  if (initial.kind === "paid") {
    return (
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 ring-1 ring-primary/10">
        <div className="flex gap-3">
          <CheckCircle2 className="size-6 shrink-0 text-primary" aria-hidden />
          <div>
            <h1 className="text-lg font-semibold text-foreground">Payment confirmed</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your download is unlocked. PDF export uses the same resume content you see in preview.
            </p>
          </div>
        </div>
        <Link
          href={ROUTES.app.projectPreview(projectId)}
          className={cn(buttonVariants({ size: "touch" }), "mt-6 inline-flex w-full justify-center")}
        >
          Open preview & download
        </Link>
      </div>
    );
  }

  /* pending — poll until webhook marks completed or we time out */
  if (initial.kind === "pending" && polling) {
    return (
      <div
        className="rounded-xl border border-border bg-card p-6 shadow-sm ring-1 ring-foreground/5"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="flex gap-3">
          <Loader2 className="size-6 shrink-0 animate-spin text-primary" aria-hidden />
          <div>
            <h1 className="text-lg font-semibold text-foreground">Confirming payment</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Securing your receipt with Stripe. This usually takes a few seconds.
            </p>
            <p className="mt-3 text-caption text-muted-foreground">
              Downloads unlock only after our server receives a verified Stripe webhook — not from this
              page alone.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* Polling timed out — still pending */
  if (initial.kind === "pending" && !polling) {
    return (
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6 ring-1 ring-amber-500/10">
        <h1 className="text-lg font-semibold text-foreground">Still processing</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We could not confirm payment yet. Refresh your preview in a minute — if the charge appears on
          your card, your download will unlock automatically.
        </p>
        <Link
          href={ROUTES.app.projectPreview(projectId)}
          className={cn(buttonVariants({ size: "touch" }), "mt-6 inline-flex w-full justify-center")}
        >
          Back to preview
        </Link>
      </div>
    );
  }

  return null;
}

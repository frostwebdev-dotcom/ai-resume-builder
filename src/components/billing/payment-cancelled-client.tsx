"use client";

import Link from "next/link";
import { useEffect } from "react";
import { XCircle } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { trackClientEvent } from "@/lib/analytics/client";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Props = {
  projectId: string;
  projectTitle: string;
};

export function PaymentCancelledClient({ projectId, projectTitle }: Props) {
  useEffect(() => {
    trackClientEvent(ANALYTICS_EVENTS.PAYMENT_CANCELLED_PAGE_VIEWED, {
      project_id_prefix: projectId.slice(0, 8),
    });
  }, [projectId]);

  const buildHref = ROUTES.app.projectBuild(projectId);

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-8 sm:py-12">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-950/5">
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-6 text-center sm:px-8 sm:py-8">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-950/5">
            <XCircle className="size-7 text-slate-500" aria-hidden />
          </div>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">
            Payment canceled
          </h1>
          <p className="mx-auto mt-2 max-w-md text-base leading-relaxed text-slate-600">
            Your resume was not charged. You can continue editing or try again when ready.
          </p>
          <p className="mt-4 text-sm font-medium text-slate-700">{projectTitle}</p>
        </div>

        <div className="grid gap-3 px-5 py-5 sm:px-8 sm:py-7">
          <Link
            href={buildHref}
            className={cn(
              buttonVariants({ size: "touch" }),
              "h-12 w-full bg-slate-950 text-base font-semibold text-white hover:bg-slate-800",
            )}
          >
            Back to resume
          </Link>
          <Link
            href={buildHref}
            className={cn(buttonVariants({ variant: "outline", size: "touch" }), "w-full")}
          >
            Try again
          </Link>
        </div>
      </div>
    </div>
  );
}

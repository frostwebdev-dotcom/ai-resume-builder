"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Cloud, Info, X } from "lucide-react";

import { pageGutterXClass } from "@/components/layout/page-container";
import { trackClientEvent } from "@/lib/analytics/client";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { RESUME_PDF_EXPORT_PRICE_USD } from "@/lib/billing/monetization-copy";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  /** Post-login: explains account import while local + server save may overlap briefly. */
  signedIn?: boolean;
  /** Sign-in URL with `next` back to `/create` for guest → account migration. */
  loginHref: string;
};

/**
 * Compact trust banner on `/create`: clarifies where the draft lives and when to sign in.
 */
export function GuestDraftLocalSaveNote({ className, signedIn = false, loginHref }: Props) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (signedIn || dismissed) return;
    trackClientEvent(ANALYTICS_EVENTS.SAVE_TO_ACCOUNT_PROMPT_VIEWED, {
      surface: "guest_create",
    });
  }, [dismissed, signedIn]);

  if (signedIn) {
    return (
      <aside
        className={cn(
          "shrink-0 border-b border-slate-200/90 bg-slate-50/90 py-2",
          pageGutterXClass,
          className,
        )}
        aria-label="How your draft is saved"
      >
        <div className="mx-auto flex w-full max-w-5xl min-w-0 items-start justify-start gap-2">
          <Info className="mt-0.5 size-3.5 shrink-0 text-slate-400" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-left text-[0.8125rem] leading-snug text-balance text-slate-600">
              You&apos;re signed in. If you had a browser draft or just returned from sign-in, we copy it into a new
              resume project and open <strong className="font-medium text-slate-800">Draft</strong> with autosave to
              your account (same studio editor). PDF export is{" "}
              <span className="font-medium text-slate-800">{RESUME_PDF_EXPORT_PRICE_USD} once per project</span> from
              the builder download action (see{" "}
              <Link
                href={ROUTES.pricing}
                className="font-medium text-[#2268d7] underline-offset-2 hover:underline"
              >
                Pricing
              </Link>
              ). Until that finishes, this tab may still show device-only save.{" "}
              <Link href={ROUTES.faq} className="font-medium text-[#2268d7] underline-offset-2 hover:underline">
                FAQ
              </Link>
            </p>
          </div>
        </div>
      </aside>
    );
  }

  if (dismissed) return null;

  return (
    <aside
      className={cn(
        "shrink-0 border-b border-slate-200/90 bg-slate-50/90 py-2.5",
        pageGutterXClass,
        className,
      )}
      aria-label="How your draft is saved"
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm min-[430px]:flex-row min-[430px]:items-center sm:px-4">
        <div className="flex min-w-0 flex-1 items-start gap-2.5">
          <Cloud className="mt-0.5 size-4 shrink-0 text-[#2268d7]" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-tight text-slate-900">Saved on this device</p>
            <p className="mt-1 text-pretty text-xs leading-relaxed text-slate-600">
              Create a free account to securely access this resume on any device.
            </p>
          </div>
        </div>
        <div className="flex min-w-0 items-center gap-2">
        <Link
          href={loginHref}
          onClick={() =>
            trackClientEvent(ANALYTICS_EVENTS.SAVE_TO_ACCOUNT_CLICKED, {
              surface: "guest_create_prompt",
            })
          }
          className="inline-flex min-h-11 min-w-0 flex-1 items-center justify-center rounded-full bg-[#2268d7] px-3 text-center text-[0.8125rem] font-semibold text-white hover:bg-[#1f5fca] min-[430px]:flex-none min-[430px]:px-4"
        >
          Save to account — free
        </Link>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Dismiss save to account prompt"
        >
          <X className="size-4" aria-hidden />
        </button>
        </div>
      </div>
    </aside>
  );
}

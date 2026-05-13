"use client";

import Link from "next/link";
import { Cloud, Info } from "lucide-react";

import { pageGutterXClass } from "@/components/layout/page-container";
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
              Preview &amp; export (see{" "}
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

  return (
    <aside
      className={cn(
        "shrink-0 border-b border-slate-200/90 bg-slate-50/90 py-2.5",
        pageGutterXClass,
        className,
      )}
      aria-label="How your draft is saved"
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between min-[420px]:gap-3">
        <div className="flex min-w-0 items-start gap-2">
          <Cloud className="mt-0.5 size-3.5 shrink-0 text-slate-400" aria-hidden />
          <p className="text-left text-[0.8125rem] leading-snug text-balance text-slate-600">
            <strong className="font-medium text-slate-800">Saves on this device.</strong> Your resume stays in this
            browser until you sign in — then we copy it to your account so nothing is stuck only on one phone.
          </p>
        </div>
        <Link
          href={loginHref}
          className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#2268d7] px-3 py-1.5 text-center text-[0.8125rem] font-semibold text-white hover:bg-[#1f5fca] min-[420px]:px-4"
        >
          Save to account — free
        </Link>
      </div>
    </aside>
  );
}

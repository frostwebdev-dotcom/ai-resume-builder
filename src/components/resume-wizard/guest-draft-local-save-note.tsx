"use client";

import Link from "next/link";
import { Info } from "lucide-react";

import { RESUME_PDF_EXPORT_PRICE_USD } from "@/lib/billing/monetization-copy";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  /** When true, avoid implying the user still needs to sign in; keep “browser-only until project” clear. */
  signedIn?: boolean;
};

/**
 * Always-visible, non-modal note for /create: local autosave, account save, and browser-data scope.
 */
export function GuestDraftLocalSaveNote({ className, signedIn = false }: Props) {
  return (
    <aside
      className={cn(
        "shrink-0 border-b border-slate-200/90 bg-slate-50/90 px-3 py-2 sm:px-4",
        className,
      )}
      aria-label="How your draft is saved"
    >
      <div className="mx-auto flex w-full max-w-5xl min-w-0 items-start justify-start gap-2">
        <Info
          className="mt-0.5 size-3.5 shrink-0 text-slate-400"
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="text-left text-[0.8125rem] leading-snug text-balance text-slate-600">
            {signedIn ? (
              <>
                You&apos;re signed in, but this page still saves in your browser only until you create a resume
                project from your dashboard and open Draft—the same studio experience, synced to your account. We
                start you with sample résumé content you can edit or replace. PDF export is{" "}
                <span className="font-medium text-slate-800">
                  {RESUME_PDF_EXPORT_PRICE_USD} once per project
                </span>{" "}
                from Preview &amp; export (see{" "}
                <Link
                  href={ROUTES.pricing}
                  className="font-medium text-[#2268d7] underline-offset-2 hover:underline"
                >
                  Pricing
                </Link>
                ); clearing this site&apos;s data here removes only this local draft.{" "}
                <Link
                  href={ROUTES.faq}
                  className="font-medium text-[#2268d7] underline-offset-2 hover:underline"
                >
                  FAQ
                </Link>
              </>
            ) : (
              <>
                We open with sample résumé content you can edit or replace, and your work autosaves in this browser
                only. When you&apos;re ready, sign in, create a resume project from your dashboard, and open Draft
                to continue in the same studio with your work synced to your account. PDF export is{" "}
                <span className="font-medium text-slate-800">
                  {RESUME_PDF_EXPORT_PRICE_USD} once per project
                </span>{" "}
                from Preview &amp; export (see{" "}
                <Link
                  href={ROUTES.pricing}
                  className="font-medium text-[#2268d7] underline-offset-2 hover:underline"
                >
                  Pricing
                </Link>
                ); anything you have already saved to your account stays available if you clear this site&apos;s
                data or switch devices.{" "}
                <Link
                  href={ROUTES.faq}
                  className="font-medium text-[#2268d7] underline-offset-2 hover:underline"
                >
                  FAQ
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    </aside>
  );
}

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
      <div className="mx-auto flex w-full max-w-5xl min-w-0 items-start justify-center gap-2 sm:justify-start">
        <Info
          className="mt-0.5 size-3.5 shrink-0 text-slate-400"
          aria-hidden
        />
        <div className="min-w-0 flex-1 overflow-x-auto [-webkit-overflow-scrolling:touch]">
          <p className="text-center text-[0.8125rem] leading-snug text-balance text-slate-600 sm:text-left">
            {signedIn ? (
              <>
                New visits open with sample résumé content you can replace. You&apos;re signed in, but this page
                still saves in this browser only until you create a{" "}
                <strong className="font-medium text-slate-800">resume project</strong> on your dashboard, then
                open <strong className="font-medium text-slate-800">Draft</strong>—same studio layout, saved to
                your account.                 PDF export is <strong className="font-medium text-slate-800">{RESUME_PDF_EXPORT_PRICE_USD} once</strong>{" "}
                per project from <strong className="font-medium text-slate-800">Preview &amp; export</strong> (see{" "}
                <Link
                  href={ROUTES.pricing}
                  className="font-medium text-[#2268d7] underline-offset-2 hover:underline"
                >
                  Pricing
                </Link>
                ). Clearing this site&apos;s data removes only this local draft.{" "}
                <Link
                  href={ROUTES.faq}
                  className="font-medium text-[#2268d7] underline-offset-2 hover:underline"
                >
                  FAQ
                </Link>
              </>
            ) : (
              <>
                New visits open with sample résumé content you can replace. Your work autosaves in this browser
                only.{" "}
                <strong className="font-medium text-slate-800">Sign in</strong>, create a resume project on your
                dashboard, then open <strong className="font-medium text-slate-800">Draft</strong>—same studio
                editor, synced to your account.                 PDF export is <strong className="font-medium text-slate-800">{RESUME_PDF_EXPORT_PRICE_USD} once</strong>{" "}
                per project from <strong className="font-medium text-slate-800">Preview &amp; export</strong> (see{" "}
                <Link
                  href={ROUTES.pricing}
                  className="font-medium text-[#2268d7] underline-offset-2 hover:underline"
                >
                  Pricing
                </Link>
                ). Clearing this site&apos;s data or another device won&apos;t remove work you already saved to
                your account.{" "}
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

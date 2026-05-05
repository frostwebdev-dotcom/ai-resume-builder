"use client";

import Link from "next/link";
import { Info } from "lucide-react";

import { pageGutterXClass } from "@/components/layout/page-container";
import { RESUME_PDF_EXPORT_PRICE_USD } from "@/lib/billing/monetization-copy";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  /** When true, avoid implying the user still needs to sign in; keep “browser-only until project” clear. */
  signedIn?: boolean;
};

/**
 * Non-modal note for `/create` when signed in: explains local vs account save while import may be pending.
 */
export function GuestDraftLocalSaveNote({ className, signedIn = false }: Props) {
  if (!signedIn) return null;

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
        <Info
          className="mt-0.5 size-3.5 shrink-0 text-slate-400"
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="text-left text-[0.8125rem] leading-snug text-balance text-slate-600">
            You&apos;re signed in. If you had a browser draft or just returned from sign-in, we copy it into a new
            resume project and open <strong className="font-medium text-slate-800">Draft</strong> with autosave to
            your account (same studio editor). PDF export is{" "}
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
            ). Until that finishes, this tab may still show device-only save.{" "}
            <Link
              href={ROUTES.faq}
              className="font-medium text-[#2268d7] underline-offset-2 hover:underline"
            >
              FAQ
            </Link>
          </p>
        </div>
      </div>
    </aside>
  );
}

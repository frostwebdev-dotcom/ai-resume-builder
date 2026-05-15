"use client";

import Link from "next/link";
import { CheckCircle2, Inbox } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

type MagicLinkSentCardProps = {
  email: string;
  /** Called when the user wants to try a different email. */
  onReset: () => void;
  /** Copy variants — mostly cosmetic. */
  mode?: "signIn" | "signUp";
  /** When true, omit the link back to `/login` (e.g. slide-in panel). */
  embedded?: boolean;
};

/**
 * "Check your inbox" confirmation after email-based auth steps (e.g. password sign-up pending
 * confirmation, or legacy magic-link templates). Copy adapts for sign-up vs sign-in.
 */
export function MagicLinkSentCard({
  email,
  onReset,
  mode = "signIn",
  embedded = false,
}: MagicLinkSentCardProps) {
  const headline = mode === "signUp" ? "Almost there — check your inbox" : "Check your inbox";
  const lead =
    mode === "signUp"
      ? "We sent an email to confirm your new account."
      : "We sent a secure sign-in link to your inbox.";

  const detail =
    mode === "signUp"
      ? "Open it on this device and follow the instructions (confirmation link or code, depending on your project settings). Then you can sign in with your email and password, or request a one-time sign-in code."
      : "Open it on this device to finish signing in.";

  return (
    <div className="space-y-5 text-center">
      <span
        className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand-muted text-brand ring-1 ring-brand/20"
        aria-hidden
      >
        <Inbox className="size-7" />
      </span>
      <div className="space-y-2">
        <h2 className="text-headline text-foreground">{headline}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {lead}{" "}
          <span className="font-semibold text-foreground">{email}</span>. {detail}
        </p>
      </div>
      <ul className="mx-auto max-w-xs space-y-2 text-left text-sm text-muted-foreground">
        <li className="flex items-start gap-2">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
          {mode === "signUp"
            ? "The message expires after a while — request a new one from the sign-in page if needed."
            : "The link expires in about an hour and can be used once."}
        </li>
        <li className="flex items-start gap-2">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
          Not seeing it? Check spam, then request a new code or link from the sign-in page.
        </li>
      </ul>
      <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
        <Button
          type="button"
          variant="outline"
          size="touch"
          className="w-full"
          onClick={onReset}
        >
          Use a different email
        </Button>
        {embedded ? null : (
          <Link
            href={ROUTES.auth.login}
            className={cn(buttonVariants({ variant: "ghost", size: "touch" }), "w-full")}
          >
            Back to sign in
          </Link>
        )}
      </div>
    </div>
  );
}

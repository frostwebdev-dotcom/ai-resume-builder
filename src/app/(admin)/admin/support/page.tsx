import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, Inbox, Mail } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { appAbsoluteUrl } from "@/lib/email/app-origin";

export const metadata: Metadata = {
  title: "Admin · Support",
  robots: { index: false, follow: false },
};

export default function AdminSupportPage() {
  const contactUrl = appAbsoluteUrl(ROUTES.contact);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <p className="text-eyebrow">Support</p>
        <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Contact & inbound requests
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The public contact form sends email via Resend; submissions are not stored in Postgres today.
          Use your email provider or Resend dashboard for a searchable history of support threads.
        </p>
      </div>

      <section className="rounded-xl border border-border/70 bg-card p-6 shadow-soft sm:p-8">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-muted text-brand ring-1 ring-brand/15">
            <Inbox className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 space-y-2">
            <h2 className="font-semibold text-foreground">What is tracked in the app</h2>
            <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
              <li>
                <strong className="text-foreground">Product analytics table</strong> — allowlisted
                client/server events (no resume body).
              </li>
              <li>
                <strong className="text-foreground">Orders & payments</strong> — see{" "}
                <Link href={ROUTES.admin.orders} className="font-medium text-brand underline-offset-4 hover:underline">
                  Orders
                </Link>
                .
              </li>
              <li>
                <strong className="text-foreground">Audit log</strong> — some platform actions (e.g. order
                completed via webhook) — see{" "}
                <Link href={ROUTES.admin.audit} className="font-medium text-brand underline-offset-4 hover:underline">
                  Audit log
                </Link>
                .
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border/70 bg-card p-6 shadow-soft sm:p-8">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground ring-1 ring-border">
            <Mail className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 space-y-3">
            <h2 className="font-semibold text-foreground">Where to read real messages</h2>
            <p className="text-sm text-muted-foreground">
              Staff copies go to <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">CONTACT_FORM_NOTIFY_EMAIL</code>{" "}
              when configured. Users receive a confirmation at the address they entered.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href={contactUrl}
                target="_blank"
                rel="noreferrer"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
              >
                Open contact page
                <ExternalLink className="size-3.5" aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

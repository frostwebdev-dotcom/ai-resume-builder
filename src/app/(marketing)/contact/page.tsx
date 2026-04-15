import type { Metadata } from "next";
import Link from "next/link";

import { PageContainer } from "@/components/layout/page-container";
import { MktSection } from "@/components/marketing/mkt-section";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact AI Resume Builder for product questions, partnerships, and support.",
};

function getContactEmail(): string {
  return (
    process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || "contact@yourdomain.com"
  );
}

export default function ContactPage() {
  const email = getContactEmail();
  const mailto = `mailto:${email}?subject=${encodeURIComponent("AI Resume Builder — inquiry")}`;

  return (
    <MktSection className="pt-10 sm:pt-14">
      <PageContainer>
        <div className="mx-auto max-w-2xl">
          <h1 className="text-display">Contact</h1>
          <p className="mt-3 text-body-muted">
            We read every message. For billing issues, include the email on your account and the date
            of purchase.
          </p>

          <div className="mt-10 rounded-xl border border-border bg-card p-6 sm:p-8">
            <h2 className="text-subhead">Email</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Set <code className="rounded bg-muted px-1.5 py-0.5 text-xs">NEXT_PUBLIC_CONTACT_EMAIL</code>{" "}
              in production to replace the placeholder below.
            </p>
            <p className="mt-4">
              <a
                href={mailto}
                className="text-base font-medium text-primary underline-offset-4 hover:underline"
              >
                {email}
              </a>
            </p>
          </div>

          <p className="mt-10 text-sm text-muted-foreground">
            Prefer to start right away?{" "}
            <Link href={ROUTES.auth.signup} className="font-medium text-foreground underline-offset-4 hover:underline">
              Create a free account
            </Link>{" "}
            and explore the editor.
          </p>

          <div className="mt-8">
            <Link href={ROUTES.faq} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              Read the FAQ
            </Link>
          </div>
        </div>
      </PageContainer>
    </MktSection>
  );
}

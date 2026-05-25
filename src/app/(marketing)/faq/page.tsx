import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { MktSection } from "@/components/marketing/mkt-section";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RESUME_PDF_EXPORT_PRICE_USD } from "@/lib/billing/monetization-copy";
import { APP_NAME, ROUTES } from "@/lib/constants";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "FAQ",
    description: `Frequently asked questions about ${APP_NAME} — pricing, privacy, ATS, exports, and account basics.`,
  };
}

const faqs: { q: string; a: ReactNode }[] = [
  {
    q: `Is ${APP_NAME} free to try?`,
    a: "Yes. You can build and preview your resume without paying. You only pay when you export your final PDF.",
  },
  {
    q: "What costs money—and what stays free?",
    a: `Drafting and on-screen preview are free, including starting on ${ROUTES.create} before you sign in. After you create a resume project, PDF export is ${RESUME_PDF_EXPORT_PRICE_USD} once at Stripe checkout for that same project (covers fresh downloads when you edit). Optional add-ons will be labeled clearly when they ship. No subscription at launch.`,
  },
  {
    q: "I started without an account — where is my draft saved?",
    a: "While you are signed out, your draft autosaves in this browser only. After you sign in, create a resume project on your dashboard, then open Draft—you get the same studio editor as the public builder, with autosave to your account. PDF export unlocks directly inside the builder for that project. Clearing this site's stored data or using another browser removes only that local draft—not work you already saved to your account.",
  },
  {
    q: "Will this work with applicant tracking systems (ATS)?",
    a: "We design layouts and headings to be machine-readable: clear section titles, consistent date formats, and minimal layout tricks that confuse parsers. No tool can guarantee every employer’s system — but we optimize for common ATS behavior.",
  },
  {
    q: "Do I need a subscription?",
    a: "No subscription is required at launch. Pricing is built around a simple export purchase, with optional add-ons later (like cover letters) clearly labeled when they arrive.",
  },
  {
    q: "Can I edit on my phone?",
    a: "Yes. The interface is mobile-first: large controls, readable type, and previews that reflect how your PDF will look.",
  },
  {
    q: "Who can see my resume content?",
    a: "Your content is tied to your account and protected by standard Supabase security practices. We process data to provide the product — not to sell your resume to third parties.",
  },
  {
    q: "How do refunds work?",
    a: (
      <>
        Digital unlocks are usually final once delivered, but we may refund or credit duplicate charges,
        confirmed unlock failures we cannot fix in reasonable time, or where the law requires it. See our{" "}
        <Link
          href={ROUTES.refundPolicy}
          className="font-medium text-brand underline-offset-4 hover:underline"
        >
          Refund policy
        </Link>{" "}
        and contact us with your account email and purchase date if something looks wrong.
      </>
    ),
  },
];

export default function FaqPage() {
  return (
    <MktSection className="pt-12 sm:pt-20">
      <PageContainer>
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-eyebrow justify-center">Help center</p>
          <h1 className="mt-3 text-display">Frequently asked questions</h1>
          <p className="mt-4 text-body-muted">
            Straight answers about building, exporting, and privacy — updated as we ship new
            features.
          </p>
        </div>

        <div className="mx-auto mt-14 max-w-3xl divide-y divide-border/70 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft">
          {faqs.map((item) => (
            <details
              key={item.q}
              className="group px-5 py-5 transition-colors hover:bg-muted/30 sm:px-7 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-left text-base font-semibold text-foreground marker:content-none sm:gap-4">
                <span className="min-w-0 flex-1 pr-1">{item.q}</span>
                <ChevronDown
                  className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 ease-out group-open:rotate-180 group-open:text-brand"
                  aria-hidden
                />
              </summary>
              <div className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.a}</div>
            </details>
          ))}
        </div>

        <p className="mx-auto mt-10 max-w-2xl text-center text-caption">
          Still stuck?{" "}
          <Link
            href={ROUTES.contact}
            className="font-medium text-brand underline-offset-4 hover:underline"
          >
            Contact us
          </Link>
          .
        </p>

        <div className="mt-10 flex justify-center">
          <Link
            href={ROUTES.create}
            className={cn(
              buttonVariants({ size: "touch" }),
              "bg-brand text-brand-foreground hover:bg-brand/90",
            )}
          >
            Start free
          </Link>
        </div>
      </PageContainer>
    </MktSection>
  );
}

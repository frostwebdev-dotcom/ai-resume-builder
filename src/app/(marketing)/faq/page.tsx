import type { Metadata } from "next";
import Link from "next/link";

import { PageContainer } from "@/components/layout/page-container";
import { MktSection } from "@/components/marketing/mkt-section";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Frequently asked questions about AI Resume Builder — pricing, privacy, ATS, exports, and account basics.",
};

const faqs = [
  {
    q: "Is AI Resume Builder free to try?",
    a: "Yes. You can build and preview your resume without paying. You only pay when you export your final PDF.",
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
    a: "We aim to be fair if something breaks on export. Contact support with your order details and we will review. Final policy language will live in our Terms as checkout goes live.",
  },
] as const;

export default function FaqPage() {
  return (
    <MktSection className="pt-10 sm:pt-14">
      <PageContainer>
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-display">Frequently asked questions</h1>
          <p className="mt-3 text-body-muted">
            Straight answers about building, exporting, and privacy — updated as we ship new
            features.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-3xl divide-y divide-border rounded-xl border border-border bg-card">
          {faqs.map((item) => (
            <details
              key={item.q}
              className="group px-4 py-4 sm:px-6 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-sm font-semibold text-foreground marker:content-none">
                {item.q}
                <span className="text-muted-foreground transition group-open:rotate-180">▼</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </div>

        <p className="mx-auto mt-10 max-w-2xl text-center text-caption">
          Still stuck?{" "}
          <Link href={ROUTES.contact} className="font-medium text-foreground underline-offset-4 hover:underline">
            Contact us
          </Link>
          .
        </p>

        <div className="mt-10 flex justify-center">
          <Link href={ROUTES.auth.signup} className={cn(buttonVariants({ size: "touch" }))}>
            Start free
          </Link>
        </div>
      </PageContainer>
    </MktSection>
  );
}

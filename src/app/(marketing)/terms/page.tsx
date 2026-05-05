import type { Metadata } from "next";
import { CalendarDays, ScrollText } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { MktSection } from "@/components/marketing/mkt-section";
import { APP_NAME } from "@/lib/constants";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Terms of Service",
    description: `Terms governing your use of ${APP_NAME}.`,
    robots: { index: true, follow: true },
  };
}

const sections = [
  {
    id: "the-service",
    title: "The service",
    body: "We provide tools to draft, preview, and export resumes. Features may change as we ship improvements. We strive for high availability but do not guarantee uninterrupted access.",
  },
  {
    id: "accounts",
    title: "Accounts",
    body: "You are responsible for your account credentials and for the accuracy of information you submit. You must not misuse the service (for example, attempting to access others' data, attacking infrastructure, or uploading unlawful content).",
  },
  {
    id: "payments",
    title: "Payments & exports",
    body: "Certain actions (such as PDF export) may require payment. Prices and taxes are presented at checkout. Unless stated otherwise, purchases are subject to the refund approach described in our FAQ and communications — finalize refund language with counsel before launch.",
  },
  {
    id: "content",
    title: "Content",
    body: "You retain rights to your resume content. You grant us the license we need to host, process, and display your content to operate the service (including AI-assisted features you request).",
  },
  {
    id: "disclaimer",
    title: "Disclaimer",
    body: "The service is provided \u201Cas is.\u201D We do not guarantee job outcomes, interview requests, or compatibility with every employer system. To the maximum extent permitted by law, we disclaim warranties not expressly stated here.",
  },
  {
    id: "liability",
    title: "Limitation of liability",
    body: "To the maximum extent permitted by law, our total liability for claims arising from the service will be limited to the amounts you paid us in the twelve months preceding the claim (or, if none, zero). Some jurisdictions do not allow certain limitations — in those cases, our liability is limited to the fullest extent allowed.",
  },
  {
    id: "changes",
    title: "Changes",
    body: "We may update these terms. Continued use after changes constitutes acceptance. Material changes will be communicated in-product or by email where appropriate.",
  },
] as const;

export default function TermsPage() {
  return (
    <MktSection className="pt-12 sm:pt-20">
      <PageContainer>
        <div className="mx-auto max-w-3xl">
          <p className="text-eyebrow">
            <ScrollText className="size-3.5" aria-hidden />
            Terms of service
          </p>
          <h1 className="mt-3 text-display">The rules for using our product</h1>
          <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground">
            <CalendarDays className="size-3.5" aria-hidden />
            Last updated: April 15, 2026
          </p>
          <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
            These terms govern your access to &quot;{APP_NAME}&quot;. By using the service, you agree to
            them. If you do not agree, do not use the product.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-6xl gap-10 lg:grid-cols-[16rem_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                On this page
              </p>
              <nav aria-label="Section navigation" className="mt-3">
                <ol className="space-y-1.5 text-sm">
                  {sections.map((s, i) => (
                    <li key={s.id}>
                      <a
                        href={`#${s.id}`}
                        className="flex items-start gap-2 rounded-lg px-2 py-1.5 text-muted-foreground transition-colors hover:bg-brand-muted hover:text-foreground"
                      >
                        <span className="mt-0.5 w-5 shrink-0 text-right font-mono text-[0.7rem] text-muted-foreground/80">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span>{s.title}</span>
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            </div>
          </aside>

          <article className="min-w-0 max-w-3xl">
            {sections.map((s, i) => (
              <section
                key={s.id}
                id={s.id}
                className="scroll-mt-24 border-b border-border/60 pb-10 pt-10 first:pt-0 last:border-b-0"
              >
                <div className="flex items-start gap-4">
                  <span
                    className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-muted font-mono text-[0.75rem] font-semibold text-brand ring-1 ring-brand/15"
                    aria-hidden
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-subhead text-foreground">{s.title}</h2>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-[0.95rem]">
                      {s.body}
                    </p>
                  </div>
                </div>
              </section>
            ))}
          </article>
        </div>
      </PageContainer>
    </MktSection>
  );
}

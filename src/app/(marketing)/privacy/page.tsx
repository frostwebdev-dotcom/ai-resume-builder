import type { Metadata } from "next";
import { CalendarDays, ShieldCheck } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { MktSection } from "@/components/marketing/mkt-section";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How AI Resume Builder collects, uses, and protects your information.",
  robots: { index: true, follow: true },
};

const sections = [
  {
    id: "information-we-collect",
    title: "Information we collect",
    body: "We collect information you provide directly — such as account details (e.g., email) and resume content you enter in the editor. We also collect limited technical data needed to operate the service (for example, authentication tokens, basic diagnostics, and security logs).",
  },
  {
    id: "how-we-use",
    title: "How we use information",
    body: "We use your information to provide the product: saving your projects, generating previews and PDFs, processing payments through our payment provider, and communicating transactional emails (such as password resets). We may use aggregated or de-identified data to understand product usage and improve reliability.",
  },
  {
    id: "ai-features",
    title: "AI features",
    body: "When you request AI assistance, relevant portions of your content may be sent to our AI provider to generate suggestions. We configure these requests to support the feature and do not sell your resume text to third parties for advertising.",
  },
  {
    id: "retention",
    title: "Data retention & deletion",
    body: "We retain account and project data as long as your account is active and as needed to comply with law. You may request deletion of your account by contacting us; some records may be retained where required for legitimate business or legal reasons (such as payment records).",
  },
  {
    id: "security",
    title: "Security",
    body: "We use industry-standard practices and trusted infrastructure providers (including Supabase for authentication and database services). No online service can guarantee perfect security — please use a strong password and protect your account credentials.",
  },
  {
    id: "contact",
    title: "Contact",
    body: "Questions about privacy? Reach out via the contact page. Replace placeholder contact details with your production support address before launch.",
  },
] as const;

export default function PrivacyPage() {
  return (
    <MktSection className="pt-12 sm:pt-20">
      <PageContainer>
        <div className="mx-auto max-w-3xl">
          <p className="text-eyebrow">
            <ShieldCheck className="size-3.5" aria-hidden />
            Privacy policy
          </p>
          <h1 className="mt-3 text-display">How we handle your data</h1>
          <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground">
            <CalendarDays className="size-3.5" aria-hidden />
            Last updated: April 15, 2026
          </p>
          <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
            This policy describes how &quot;AI Resume Builder&quot; (&ldquo;we&rdquo;, &ldquo;us&rdquo;)
            handles information when you use our website and product. It is written for
            transparency and will evolve as features ship — check back for updates.
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

          <article className="max-w-3xl">
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

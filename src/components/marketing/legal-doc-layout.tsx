import { CalendarDays } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { PageContainer } from "@/components/layout/page-container";
import { MktSection } from "@/components/marketing/mkt-section";

export type LegalDocSection = {
  id: string;
  title: string;
  body: ReactNode;
};

export type LegalDocLayoutProps = {
  eyebrowIcon: LucideIcon;
  eyebrowLabel: string;
  title: string;
  lastUpdated: string;
  intro: ReactNode;
  sections: readonly LegalDocSection[];
};

export function LegalDocLayout({
  eyebrowIcon: EyebrowIcon,
  eyebrowLabel,
  title,
  lastUpdated,
  intro,
  sections,
}: LegalDocLayoutProps) {
  return (
    <MktSection className="pt-12 sm:pt-20">
      <PageContainer>
        <div className="mx-auto max-w-3xl">
          <p className="text-eyebrow">
            <EyebrowIcon className="size-3.5" aria-hidden />
            {eyebrowLabel}
          </p>
          <h1 className="mt-3 text-display">{title}</h1>
          <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground">
            <CalendarDays className="size-3.5" aria-hidden />
            Last updated: {lastUpdated}
          </p>
          <div className="mt-6 text-sm leading-relaxed text-muted-foreground">{intro}</div>
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
                    <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground sm:text-[0.95rem]">
                      {s.body}
                    </div>
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

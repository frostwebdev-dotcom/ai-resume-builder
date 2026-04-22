import Link from "next/link";
import { Lock, ShieldCheck, Sparkles } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { APP_NAME, ROUTES } from "@/lib/constants";

const footerGroups = [
  {
    title: "Product",
    links: [
      { href: ROUTES.howItWorks, label: "How it works" },
      { href: ROUTES.templates, label: "Templates" },
      { href: ROUTES.pricing, label: "Pricing" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: ROUTES.faq, label: "FAQ" },
      { href: ROUTES.contact, label: "Contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: ROUTES.privacy, label: "Privacy" },
      { href: ROUTES.terms, label: "Terms" },
    ],
  },
] as const;

export function MarketingFooter() {
  return (
    <footer className="relative mt-auto border-t border-border/70 bg-muted/25">
      <PageContainer className="py-14 sm:py-16">
        <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_auto] md:gap-12">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5">
              <span className="brand-mark" aria-hidden>
                S
              </span>
              <p className="text-sm font-semibold tracking-tight">{APP_NAME}</p>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Professional, ATS-friendly resumes in minutes. Preview free — pay
              only to export your PDF.
            </p>
            <ul className="trust-row mt-5 !justify-start">
              <li>
                <ShieldCheck
                  className="size-3.5 text-success"
                  aria-hidden
                />
                <span>Encrypted in transit</span>
              </li>
              <li>
                <Lock className="size-3.5 text-brand" aria-hidden />
                <span>Stripe-secured checkout</span>
              </li>
              <li>
                <Sparkles className="size-3.5 text-foreground/70" aria-hidden />
                <span>No subscription</span>
              </li>
            </ul>
          </div>
          <nav
            aria-label="Footer"
            className="grid grid-cols-2 gap-x-10 gap-y-8 sm:grid-cols-3 md:gap-x-14"
          >
            {footerGroups.map((group) => (
              <div key={group.title}>
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-foreground/70">
                  {group.title}
                </p>
                <ul className="mt-3 space-y-2.5">
                  {group.links.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <hr className="hr-hairline mt-12" />
        <div className="mt-6 flex flex-col items-center justify-between gap-3 text-xs text-muted-foreground md:flex-row md:text-left">
          <p>
            © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
          <Link
            href={ROUTES.styleGuide}
            className="text-muted-foreground/80 transition-colors hover:text-foreground"
          >
            Design system
          </Link>
        </div>
      </PageContainer>
    </footer>
  );
}

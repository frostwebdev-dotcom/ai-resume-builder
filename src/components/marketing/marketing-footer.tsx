import Link from "next/link";

import { PageContainer } from "@/components/layout/page-container";
import { APP_NAME, ROUTES } from "@/lib/constants";

const footerNav = [
  { href: ROUTES.howItWorks, label: "How it works" },
  { href: ROUTES.templates, label: "Templates" },
  { href: ROUTES.pricing, label: "Pricing" },
  { href: ROUTES.faq, label: "FAQ" },
  { href: ROUTES.contact, label: "Contact" },
  { href: ROUTES.privacy, label: "Privacy" },
  { href: ROUTES.terms, label: "Terms" },
] as const;

export function MarketingFooter() {
  return (
    <footer className="border-t border-border/80 bg-muted/30">
      <PageContainer className="py-12 sm:py-14">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <p className="text-sm font-semibold tracking-tight">{APP_NAME}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Professional, ATS-friendly resumes in minutes. Preview free — pay only to export your
              PDF.
            </p>
          </div>
          <nav aria-label="Footer">
            <ul className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
              {footerNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href={ROUTES.styleGuide}
                  className="text-sm text-muted-foreground/80 transition-colors hover:text-foreground"
                >
                  Design system
                </Link>
              </li>
            </ul>
          </nav>
        </div>
        <p className="mt-10 text-center text-xs text-muted-foreground md:text-left">
          © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
        </p>
      </PageContainer>
    </footer>
  );
}

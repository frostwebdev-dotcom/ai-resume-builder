import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { MktSection } from "@/components/marketing/mkt-section";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple one-time pricing for resume PDF export. Preview free — pay only when you download. Cover letter and premium bundles coming soon.",
};

const plans = [
  {
    name: "Resume PDF",
    price: "Pay once",
    description: "Export your finalized resume as a polished PDF when you are ready.",
    bullets: ["Build & preview free", "ATS-friendly layout", "Secure download"],
    cta: "Start free",
    href: ROUTES.auth.signup,
    featured: true,
    footnote: "Final price shown at checkout. No subscription.",
  },
  {
    name: "Resume + Cover letter",
    price: "Coming soon",
    description: "Matched cover letter generated from your resume and job context.",
    bullets: ["Same resume purchase flow", "Tailored tone", "Export as PDF"],
    cta: "Get notified",
    href: ROUTES.contact,
    featured: false,
    footnote: "Optional add-on — pricing TBD.",
  },
  {
    name: "Premium bundle",
    price: "Future",
    description: "Reserved for deeper tailoring, multiple versions, or team use cases.",
    bullets: ["Job-specific passes", "Version packs", "Priority support (exploring)"],
    cta: "Contact us",
    href: ROUTES.contact,
    featured: false,
    footnote: "Not available yet — schema and checkout will evolve without breaking core pricing.",
  },
] as const;

export default function PricingPage() {
  return (
    <MktSection className="pt-10 sm:pt-14">
      <PageContainer>
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-display">Pricing</h1>
          <p className="mt-3 text-body-muted">
            Start free. Pay a simple one-time fee when you export your resume PDF — no subscription
            required at launch.
          </p>
        </div>

        <ul className="mx-auto mt-12 grid max-w-5xl gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <li key={plan.name}>
              <Card
                className={cn(
                  "flex h-full flex-col border-border/80 shadow-sm",
                  plan.featured && "border-primary/25 ring-1 ring-primary/15",
                )}
              >
                <CardHeader>
                  {plan.featured ? (
                    <p className="text-xs font-medium uppercase tracking-wider text-primary">
                      Current focus
                    </p>
                  ) : plan.price === "Coming soon" ? (
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Roadmap
                    </p>
                  ) : (
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Future
                    </p>
                  )}
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription className="text-base font-medium text-foreground">
                    {plan.price}
                  </CardDescription>
                  <CardDescription className="pt-1 text-sm leading-relaxed">
                    {plan.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {plan.bullets.map((b) => (
                      <li key={b} className="flex gap-2">
                        <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                        {b}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="flex flex-col items-stretch gap-2 border-t border-border/60 bg-muted/20">
                  <Link
                    href={plan.href}
                    className={cn(
                      buttonVariants({
                        size: "touch",
                        variant: plan.featured ? "default" : "outline",
                      }),
                    )}
                  >
                    {plan.cta}
                  </Link>
                  <p className="text-center text-xs text-muted-foreground">{plan.footnote}</p>
                </CardFooter>
              </Card>
            </li>
          ))}
        </ul>

        <p className="mx-auto mt-10 max-w-2xl text-center text-caption">
          Taxes may apply based on your region. Stripe handles checkout securely — we never store card
          numbers on our servers.
        </p>
      </PageContainer>
    </MktSection>
  );
}

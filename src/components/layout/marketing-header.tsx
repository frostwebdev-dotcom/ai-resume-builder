import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { getOptionalAuth } from "@/lib/auth/guards";
import { cn } from "@/lib/utils";
import { APP_NAME, ROUTES } from "@/lib/constants";

const navLinks = [
  { href: ROUTES.howItWorks, label: "How it works" },
  { href: ROUTES.templates, label: "Templates" },
  { href: ROUTES.pricing, label: "Pricing" },
] as const;

export async function MarketingHeader() {
  const ctx = await getOptionalAuth();

  return (
    <header className="border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex min-h-14 max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-2 sm:px-6 sm:py-0 lg:px-8">
        <Link
          href={ROUTES.home}
          className="flex min-h-10 shrink-0 items-center text-sm font-semibold tracking-tight"
        >
          {APP_NAME}
        </Link>
        <nav
          className="order-3 flex w-full min-w-0 flex-1 items-center justify-center gap-0.5 overflow-x-auto pb-1 sm:order-none sm:w-auto sm:justify-end sm:pb-0 md:flex-none"
          aria-label="Primary"
        >
          <ul className="flex items-center gap-0.5 sm:gap-1">
            {navLinks.map((item) => (
              <li key={item.href} className="shrink-0">
                <Link
                  href={item.href}
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "whitespace-nowrap px-2.5 text-muted-foreground sm:px-3",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1 sm:gap-2">
          {ctx ? (
            <Link href={ROUTES.app.root} className={cn(buttonVariants({ size: "sm" }))}>
              Open app
            </Link>
          ) : (
            <>
              <Link
                href={ROUTES.auth.login}
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
              >
                Log in
              </Link>
              <Link href={ROUTES.auth.signup} className={cn(buttonVariants({ size: "sm" }))}>
                Sign up free
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

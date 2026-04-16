"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";

const navLinks = [
  { href: ROUTES.howItWorks, label: "How it works" },
  { href: ROUTES.templates, label: "Templates" },
  { href: ROUTES.pricing, label: "Pricing" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Subtle pending bar shown beneath the link while navigation is in flight.
 * Uses a fixed-size, always-rendered element so it never causes layout shift.
 */
function PendingBar({ active }: { active: boolean }) {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden
      data-pending={pending || undefined}
      data-active={active || undefined}
      className={cn(
        "pointer-events-none absolute inset-x-2 -bottom-px h-0.5 origin-left scale-x-0 rounded-full bg-brand opacity-0 transition-all duration-200 ease-out",
        // Show bar at full width and 100% opacity when the current route matches
        "data-[active]:scale-x-100 data-[active]:opacity-100",
        // While click is pending, animate to visible so users get instant feedback
        "data-[pending]:scale-x-100 data-[pending]:opacity-100 data-[pending]:animate-pulse",
      )}
    />
  );
}

export function MarketingPrimaryNav() {
  const pathname = usePathname();

  return (
    <nav
      className="flex min-w-0 items-center justify-center"
      aria-label="Primary"
    >
      <ul
        className={cn(
          "flex items-center gap-0.5 overflow-x-auto sm:gap-1",
          // hide scrollbar on overflow without breaking touch scroll
          "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        )}
      >
        {navLinks.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                data-active={active || undefined}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "relative whitespace-nowrap px-2.5 transition-colors sm:px-3",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
                <PendingBar active={active} />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

type AuthLinksProps = {
  isAuthed: boolean;
};

export function MarketingAuthLinks({ isAuthed }: AuthLinksProps) {
  const pathname = usePathname();

  if (isAuthed) {
    return (
      <Link
        href={ROUTES.app.root}
        className={cn(
          buttonVariants({ size: "sm" }),
          "relative bg-brand text-brand-foreground hover:bg-brand/90",
        )}
      >
        Open app
        <PendingBar active={false} />
      </Link>
    );
  }

  const loginActive = isActive(pathname, ROUTES.auth.login);
  const signupActive = isActive(pathname, ROUTES.auth.signup);

  return (
    <>
      <Link
        href={ROUTES.auth.login}
        aria-current={loginActive ? "page" : undefined}
        data-active={loginActive || undefined}
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "relative",
          loginActive && "text-foreground",
        )}
      >
        Log in
        <PendingBar active={loginActive} />
      </Link>
      <Link
        href={ROUTES.auth.signup}
        aria-current={signupActive ? "page" : undefined}
        data-active={signupActive || undefined}
        className={cn(
          buttonVariants({ size: "sm" }),
          "relative bg-brand text-brand-foreground shadow-soft hover:bg-brand/90",
        )}
      >
        Sign up free
        <PendingBar active={signupActive} />
      </Link>
    </>
  );
}

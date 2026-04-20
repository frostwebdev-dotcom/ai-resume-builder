"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";

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

/**
 * "Create Resume" CTA — appears in the header for both authed and unauthed users.
 * Destination is always `/app`: authed users land on the dashboard's quick-create form;
 * unauthed users are caught by the `requireUser` guard and redirected to `/login?next=/app`,
 * which means after the magic link / password step they arrive straight at the creation screen.
 *
 * Label collapses to "Create" on narrow screens so the header stays on one row on small phones;
 * the full "Create Resume" text is always in the accessible name.
 */
function CreateResumeButton({ className }: { className?: string }) {
  return (
    <Link
      href={ROUTES.app.root}
      aria-label="Create a new resume"
      className={cn(
        buttonVariants({ size: "sm" }),
        "relative gap-1.5 bg-brand text-brand-foreground shadow-soft hover:bg-brand/90",
        className,
      )}
    >
      <Plus className="size-4" aria-hidden />
      <span className="sm:hidden">Create</span>
      <span className="hidden sm:inline">Create Resume</span>
      <PendingBar active={false} />
    </Link>
  );
}

export function MarketingAuthLinks({ isAuthed }: AuthLinksProps) {
  const pathname = usePathname();

  if (isAuthed) {
    // Authed users: "My resumes" (secondary) + "Create Resume" (primary brand CTA).
    return (
      <>
        <Link
          href={ROUTES.app.root}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "relative hidden sm:inline-flex",
          )}
          aria-label="Go to your resumes"
        >
          My resumes
          <PendingBar active={false} />
        </Link>
        <CreateResumeButton />
      </>
    );
  }

  // Unauthed: Log In (ghost) + Create Resume (primary brand CTA).
  // `/login` is the single auth entry for new and returning users; clicking "Create Resume"
  // lands on `/login?next=/app` via the app guard, so the CTA doubles as the acquisition funnel.
  const loginActive = isActive(pathname, ROUTES.auth.login);

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
        Log In
        <PendingBar active={loginActive} />
      </Link>
      <CreateResumeButton />
    </>
  );
}

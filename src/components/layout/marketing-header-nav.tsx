"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";

import { UserMenu } from "@/components/auth/user-menu";
import { NewResumeServerForm } from "@/components/projects/new-resume-server-form";
import { dashboardSidebarActive } from "@/components/projects/dashboard-workspace-grid";
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
  /** Present when signed in — drives the account menu in the marketing header. */
  userEmail?: string | null;
  isAdmin?: boolean;
};

const workspaceGhostLink = cn(
  buttonVariants({ variant: "ghost", size: "sm" }),
  "relative whitespace-nowrap px-2 text-xs sm:px-2.5 sm:text-sm",
);

const marketingNewResumeButtonClass = cn(
  buttonVariants({ size: "sm" }),
  "relative shrink-0 gap-1.5 bg-brand text-brand-foreground shadow-soft hover:bg-brand/90",
  "disabled:pointer-events-none disabled:opacity-65",
);

function isAppDashboardActive(pathname: string) {
  return pathname === ROUTES.app.root || pathname === `${ROUTES.app.root}/`;
}

/**
 * Signed-out CTA: public `/create` builder (local draft until sign-in).
 */
function GuestCreateResumeLink({ className }: { className?: string }) {
  const pathname = usePathname();
  const active = isActive(pathname, ROUTES.create);

  return (
    <Link
      href={ROUTES.create}
      aria-label="Create a resume without signing in"
      data-active={active || undefined}
      className={cn(
        buttonVariants({ size: "sm" }),
        "relative gap-1.5 bg-brand text-brand-foreground shadow-soft hover:bg-brand/90",
        className,
      )}
    >
      <Plus className="size-4 shrink-0" aria-hidden />
      <span className="sm:hidden">Create</span>
      <span className="hidden sm:inline">Create Resume</span>
      <PendingBar active={active} />
    </Link>
  );
}

export function MarketingAuthLinks({
  isAuthed,
  userEmail = null,
  isAdmin = false,
}: AuthLinksProps) {
  const pathname = usePathname();

  if (isAuthed) {
    const dashboardActive = isAppDashboardActive(pathname);
    const resumesActive = dashboardSidebarActive(pathname, ROUTES.app.resumes);

    return (
      <div className="flex min-w-0 flex-wrap items-center justify-end gap-1 sm:gap-1.5">
        <nav
          className="flex min-w-0 items-center gap-0.5 sm:gap-1"
          aria-label="Workspace"
        >
          <Link
            href={ROUTES.app.root}
            aria-current={dashboardActive ? "page" : undefined}
            data-active={dashboardActive || undefined}
            className={cn(
              workspaceGhostLink,
              dashboardActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            Dashboard
            <PendingBar active={dashboardActive} />
          </Link>
          <Link
            href={ROUTES.app.resumes}
            aria-current={resumesActive ? "page" : undefined}
            data-active={resumesActive || undefined}
            className={cn(
              workspaceGhostLink,
              resumesActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            Resumes
            <PendingBar active={resumesActive} />
          </Link>
        </nav>

        <NewResumeServerForm
          formClassName="inline-flex w-auto shrink-0"
          buttonClassName={cn(marketingNewResumeButtonClass, "touch-manipulation")}
          idleContent={
            <>
              <span className="hidden sm:inline">New resume</span>
              <span className="sm:hidden">New</span>
            </>
          }
          pendingText="Creating…"
        />

        {userEmail ? (
          <UserMenu email={userEmail} isAdmin={isAdmin} variant="icon" />
        ) : null}
      </div>
    );
  }

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
      <GuestCreateResumeLink />
    </>
  );
}

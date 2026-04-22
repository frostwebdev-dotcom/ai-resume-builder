"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, FileText, LayoutDashboard, UserRound } from "lucide-react";

import { dashboardSidebarActive } from "@/components/projects/dashboard-workspace-grid";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";

const items = [
  { href: ROUTES.app.root, label: "Home", icon: LayoutDashboard },
  { href: ROUTES.app.resumes, label: "Resumes", icon: FileText },
  { href: ROUTES.app.jobs, label: "Jobs", icon: Briefcase },
  { href: ROUTES.app.account, label: "Account", icon: UserRound },
] as const;

type AppBottomNavProps = {
  /** When true, Account opens sign-in with return to account after auth. */
  guest?: boolean;
};

/**
 * Thumb-zone navigation — subset of desktop sidebar for small screens.
 */
export function AppBottomNav({ guest = false }: AppBottomNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/85 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] pt-2 backdrop-blur-md supports-[backdrop-filter]:bg-background/75 md:hidden"
      aria-label="Primary"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around px-1">
        {items.map(({ href, label, icon: Icon }) => {
          const resolvedHref =
            guest && href === ROUTES.app.account
              ? `${ROUTES.auth.login}?next=${encodeURIComponent(ROUTES.app.account)}`
              : href;
          const active =
            href === ROUTES.app.account
              ? pathname === href || pathname.startsWith(`${href}/`)
              : dashboardSidebarActive(pathname, href);
          return (
            <li key={href} className="flex min-w-0 flex-1 justify-center">
              <Link
                href={resolvedHref}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-[3.25rem] min-w-0 max-w-[5.5rem] flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-2 text-[0.65rem] font-medium leading-tight transition-all",
                  active
                    ? "bg-brand-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "size-5 shrink-0 transition-colors",
                    active ? "text-brand" : "opacity-70",
                  )}
                  aria-hidden
                />
                <span className="line-clamp-2 text-center">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, UserRound } from "lucide-react";

import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";

const items = [
  { href: ROUTES.app.root, label: "Home", icon: LayoutDashboard },
  { href: ROUTES.app.account, label: "Account", icon: UserRound },
] as const;

/**
 * Thumb-zone navigation — Account opens profile shell.
 */
export function AppBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] pt-2 backdrop-blur-md supports-[backdrop-filter]:bg-background/90 md:hidden"
      aria-label="Primary"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around px-2">
        {items.map(({ href, label, icon: Icon }) => {
          const active =
            href === ROUTES.app.root
              ? pathname === ROUTES.app.root ||
                pathname.startsWith("/app/projects/")
              : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="flex min-w-0 flex-1 justify-center">
              <Link
                href={href}
                className={cn(
                  "flex min-h-[3.25rem] min-w-[3.25rem] flex-col items-center justify-center gap-1 rounded-lg px-3 py-2 text-[0.7rem] font-medium transition-colors",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "size-6",
                    active ? "text-foreground" : "opacity-70",
                  )}
                  aria-hidden
                />
                <span className="truncate">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

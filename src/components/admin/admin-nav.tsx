"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: ROUTES.admin.root, label: "Overview" },
  { href: ROUTES.admin.users, label: "Users" },
  { href: ROUTES.admin.projects, label: "Projects" },
  { href: ROUTES.admin.orders, label: "Orders" },
  { href: ROUTES.admin.aiUsage, label: "AI usage" },
  { href: ROUTES.admin.downloads, label: "Downloads" },
  { href: ROUTES.admin.audit, label: "Audit log" },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav
      className="flex min-w-0 gap-1 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      aria-label="Admin sections"
    >
      {LINKS.map(({ href, label }) => {
        const active =
          href === ROUTES.admin.root
            ? pathname === ROUTES.admin.root || pathname === `${ROUTES.admin.root}/`
            : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-brand text-brand-foreground shadow-soft"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

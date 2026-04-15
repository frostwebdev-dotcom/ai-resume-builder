import * as React from "react";

import { cn } from "@/lib/utils";

type StickyBottomBarProps = {
  children: React.ReactNode;
  className?: string;
};

/**
 * Fixed bottom actions on mobile — accounts for safe area (notch/home indicator).
 * Pair with `pb-[calc(5rem+env(safe-area-inset-bottom))]` on main content when visible.
 */
export function StickyBottomBar({ children, className }: StickyBottomBarProps) {
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/95 shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.08)] backdrop-blur-md supports-[backdrop-filter]:bg-background/90 md:hidden",
        className,
      )}
    >
      <div
        className="mx-auto flex max-w-6xl flex-col gap-3 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pt-3"
        role="region"
        aria-label="Primary actions"
      >
        {children}
      </div>
    </div>
  );
}

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PageContainerProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Horizontal padding that matches {@link PageContainer} rhythm and respects
 * notched devices. Use on app scroll regions, marketing header, etc.
 */
export const pageGutterXClass =
  "pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] sm:pl-[max(1.5rem,env(safe-area-inset-left,0px))] sm:pr-[max(1.5rem,env(safe-area-inset-right,0px))] lg:pl-[max(2rem,env(safe-area-inset-left,0px))] lg:pr-[max(2rem,env(safe-area-inset-right,0px))]";

/**
 * Mobile-first horizontal padding and max width for marketing and app shells.
 */
export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full min-w-0 max-w-6xl",
        pageGutterXClass,
        className,
      )}
    >
      {children}
    </div>
  );
}

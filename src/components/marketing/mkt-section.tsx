import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type MktSectionProps = {
  id?: string;
  children: ReactNode;
  className?: string;
  /** Extra vertical rhythm */
  padded?: boolean;
};

export function MktSection({ id, children, className, padded = true }: MktSectionProps) {
  return (
    <section
      id={id}
      className={cn(padded && "py-14 sm:py-20", className)}
    >
      {children}
    </section>
  );
}

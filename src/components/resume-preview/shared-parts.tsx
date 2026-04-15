import type { ReactNode } from "react";

import type { ResumeContactLine } from "@/lib/resume-preview/model";
import { cn } from "@/lib/utils";

export function ResumeSectionTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={cn(
        "border-b border-neutral-300/90 pb-1 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-neutral-600 print:border-neutral-400",
        className,
      )}
    >
      {children}
    </h2>
  );
}

export function ContactInline({
  lines,
  className,
  delimiter = " · ",
}: {
  lines: ResumeContactLine[];
  className?: string;
  delimiter?: string;
}) {
  if (lines.length === 0) return null;
  const flat = lines.map((l) => l.value).filter(Boolean);
  return (
    <p className={cn("text-neutral-700", className)}>
      {flat.join(delimiter)}
    </p>
  );
}

export function ContactStack({
  lines,
  className,
}: {
  lines: ResumeContactLine[];
  className?: string;
}) {
  if (lines.length === 0) return null;
  return (
    <ul className={cn("space-y-0.5 text-neutral-700", className)}>
      {lines.map((l, i) => (
        <li key={i} className="break-words">
          {l.label ? (
            <>
              <span className="text-neutral-500">{l.label}: </span>
              {l.value}
            </>
          ) : (
            l.value
          )}
        </li>
      ))}
    </ul>
  );
}

export function PlaceholderName({ children }: { children: ReactNode }) {
  return <span className="italic text-neutral-400">{children}</span>;
}

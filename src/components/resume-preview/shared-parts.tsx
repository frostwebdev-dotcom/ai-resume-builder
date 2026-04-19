import type { CSSProperties, ReactNode } from "react";

import type { ResumeContactLine } from "@/lib/resume-preview/model";
import { cn } from "@/lib/utils";

export type SectionTitleVariant = "underline" | "rule" | "accent-rule";

function urlOrNull(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  if (/^(https?:|mailto:|tel:)/i.test(s)) return s;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return `mailto:${s}`;
  if (/^\+?[\d][\d\s().-]{5,}$/.test(s)) return `tel:${s.replace(/\s+/g, "")}`;
  if (/^www\./i.test(s)) return `https://${s}`;
  if (/^[a-z0-9-]+\.[a-z]{2,}(\/|$)/i.test(s)) return `https://${s}`;
  return null;
}

type SectionTitleProps = {
  children: ReactNode;
  className?: string;
  accent?: string;
  variant?: SectionTitleVariant;
};

export function ResumeSectionTitle({
  children,
  className,
  accent,
  variant = "underline",
}: SectionTitleProps) {
  const style: CSSProperties | undefined = accent ? { color: accent } : undefined;

  if (variant === "accent-rule") {
    return (
      <h2
        className={cn(
          "flex items-center gap-2 text-[0.62rem] font-semibold uppercase tracking-[0.2em]",
          className,
        )}
        style={style}
      >
        <span aria-hidden className="inline-block h-[2px] w-7 rounded-full" style={{ backgroundColor: accent ?? "currentColor" }} />
        <span>{children}</span>
        <span
          aria-hidden
          className="ml-1 h-px flex-1 rounded-full bg-neutral-300 print:bg-neutral-400"
        />
      </h2>
    );
  }

  if (variant === "rule") {
    return (
      <h2
        className={cn(
          "border-b text-[0.62rem] font-semibold uppercase tracking-[0.2em] pb-1",
          className,
        )}
        style={
          accent
            ? { color: accent, borderColor: accent }
            : undefined
        }
      >
        {children}
      </h2>
    );
  }

  return (
    <h2
      className={cn(
        "border-b border-neutral-300/90 pb-1 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-neutral-700 print:border-neutral-400",
        className,
      )}
      style={style}
    >
      {children}
    </h2>
  );
}

type ContactProps = {
  lines: ResumeContactLine[];
  className?: string;
  /** Color used for anchor-like parts. */
  accent?: string;
};

export function ContactInline({
  lines,
  className,
  delimiter = " · ",
  accent,
}: ContactProps & { delimiter?: string }) {
  if (lines.length === 0) return null;
  const items = lines.map((l) => l.value).filter(Boolean);
  return (
    <p className={cn("text-neutral-700", className)}>
      {items.map((v, i) => {
        const href = urlOrNull(v);
        const last = i === items.length - 1;
        return (
          <span key={i}>
            {href ? (
              <a
                href={href}
                className="underline-offset-2 hover:underline"
                style={accent ? { color: accent } : undefined}
                rel="noopener noreferrer"
                target={href.startsWith("http") ? "_blank" : undefined}
              >
                {v}
              </a>
            ) : (
              v
            )}
            {!last ? <span aria-hidden>{delimiter}</span> : null}
          </span>
        );
      })}
    </p>
  );
}

export function ContactStack({ lines, className, accent }: ContactProps) {
  if (lines.length === 0) return null;
  return (
    <ul className={cn("space-y-0.5 text-neutral-700", className)}>
      {lines.map((l, i) => {
        const href = urlOrNull(l.value);
        return (
          <li key={i} className="break-words">
            {l.label ? <span className="text-neutral-500">{l.label}: </span> : null}
            {href ? (
              <a
                href={href}
                className="underline-offset-2 hover:underline"
                style={accent ? { color: accent } : undefined}
                rel="noopener noreferrer"
                target={href.startsWith("http") ? "_blank" : undefined}
              >
                {l.value}
              </a>
            ) : (
              l.value
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function PlaceholderName({ children }: { children: ReactNode }) {
  return <span className="italic text-neutral-400">{children}</span>;
}

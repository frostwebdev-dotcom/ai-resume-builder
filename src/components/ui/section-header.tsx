import * as React from "react";

import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  /** Visually rank sections without relying on decoration */
  level?: "page" | "section" | "subsection";
};

export function SectionHeader({
  title,
  description,
  action,
  className,
  level = "section",
}: SectionHeaderProps) {
  const titleClass =
    level === "page"
      ? "text-display"
      : level === "section"
        ? "text-headline"
        : "text-subhead";

  const HeadingTag = level === "page" ? "h1" : level === "section" ? "h2" : "h3";

  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6",
        className,
      )}
    >
      <div className="min-w-0 flex-1 space-y-2">
        <HeadingTag
          className={cn(titleClass, level === "subsection" && "text-foreground")}
        >
          {title}
        </HeadingTag>
        {description ? (
          <p className="prose-app max-w-2xl text-pretty">{description}</p>
        ) : null}
      </div>
      {action ? (
        <div className="shrink-0 pt-0.5 sm:pt-1">{action}</div>
      ) : null}
    </div>
  );
}

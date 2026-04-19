import type { TemplateSlug } from "@/lib/resume-preview/template-ids";
import { isTemplateSlug } from "@/lib/resume-preview/template-ids";
import { getTemplateTheme } from "@/lib/resume-preview/template-theme";
import { cn } from "@/lib/utils";

type Props = {
  slug: string;
  className?: string;
  compact?: boolean;
};

/**
 * Miniature, non-interactive visual of a resume template — rendered from the
 * same theme the full preview uses so the picker matches the real output.
 * Pure presentation: no text personalisation, just layout shapes that convey
 * header style, density, accent color, and serif vs sans.
 */
export function TemplateThumbnail({ slug, className, compact = false }: Props) {
  const safeSlug: TemplateSlug = isTemplateSlug(slug) ? slug : "athena";
  const theme = getTemplateTheme(safeSlug);
  const fontClass = theme.fontFamily === "serif" ? "font-serif" : "font-sans";

  const paperClass = cn(
    "relative aspect-[210/297] w-full overflow-hidden rounded-md bg-white shadow-[0_1px_2px_rgba(0,0,0,0.08),inset_0_0_0_1px_rgba(0,0,0,0.06)]",
    fontClass,
    className,
  );
  const pad = compact ? "p-2" : "p-2.5";
  const bar = (w: string) => cn("mt-[3px] h-[3px] rounded-full bg-neutral-300/90", w);

  if (theme.headerStyle === "banner") {
    return (
      <div className={paperClass} aria-hidden>
        <div
          className="w-full px-2.5 py-2"
          style={{ backgroundColor: theme.accentStrong }}
        >
          <div className="h-[7px] w-3/5 rounded-sm bg-white/95" />
          <div className="mt-1 h-[3px] w-2/5 rounded-sm bg-white/60" />
          <div
            className="mt-1.5 h-[2px] w-8 rounded-full"
            style={{ backgroundColor: theme.accent }}
          />
        </div>
        <div className={cn("space-y-1", pad)}>
          <SectionStrip theme={theme} />
          <div className={bar("w-full")} />
          <div className={bar("w-11/12")} />
          <div className={bar("w-10/12")} />
          <div className="h-1" />
          <SectionStrip theme={theme} />
          <div className={bar("w-full")} />
          <div className={bar("w-9/12")} />
        </div>
      </div>
    );
  }

  if (theme.headerStyle === "split") {
    return (
      <div className={cn(paperClass, pad)} aria-hidden>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div
              className="h-[7px] w-full rounded-sm"
              style={{ backgroundColor: theme.accentStrong }}
            />
            <div
              className="mt-1 h-[3px] w-3/5 rounded-sm"
              style={{ backgroundColor: theme.accent, opacity: 0.75 }}
            />
          </div>
          <div className="w-1/3 space-y-[2px]">
            <div className="ml-auto h-[2px] w-full rounded-full bg-neutral-300" />
            <div className="ml-auto h-[2px] w-5/6 rounded-full bg-neutral-300" />
            <div className="ml-auto h-[2px] w-2/3 rounded-full bg-neutral-300" />
          </div>
        </div>
        <div className="mt-1.5 flex items-center gap-1">
          <span
            className="h-[2px] w-6 rounded-full"
            style={{ backgroundColor: theme.accent }}
          />
          <span className="h-px flex-1 rounded-full bg-neutral-200" />
        </div>
        <div className="mt-2 space-y-[3px]">
          <SectionStrip theme={theme} />
          <div className={bar("w-full")} />
          <div className={bar("w-11/12")} />
          <div className={bar("w-10/12")} />
          <div className="h-[3px]" />
          <SectionStrip theme={theme} />
          <div className={bar("w-full")} />
          <div className={bar("w-9/12")} />
        </div>
      </div>
    );
  }

  if (theme.headerStyle === "compact") {
    return (
      <div className={cn(paperClass, pad)} aria-hidden>
        <div
          className="h-[6px] w-2/5 rounded-sm"
          style={{ backgroundColor: theme.accentStrong }}
        />
        <div
          className="mt-1 h-[2.5px] w-1/2 rounded-sm"
          style={{ backgroundColor: theme.accent, opacity: 0.8 }}
        />
        <div className="mt-1 h-[2px] w-full rounded-sm bg-neutral-200" />
        <div
          className="mt-1 h-px w-full"
          style={{ backgroundColor: theme.accent, opacity: 0.45 }}
        />
        <div className="mt-2 space-y-[3px]">
          <SectionStrip theme={theme} />
          <div className={bar("w-full")} />
          <div className={bar("w-11/12")} />
          <div className={bar("w-10/12")} />
          <div className={bar("w-9/12")} />
          <div className="h-[3px]" />
          <SectionStrip theme={theme} />
          <div className={bar("w-full")} />
          <div className={bar("w-10/12")} />
        </div>
      </div>
    );
  }

  /* centered */
  return (
    <div className={cn(paperClass, pad)} aria-hidden>
      <div className="flex flex-col items-center">
        <div
          className="h-[8px] w-3/5 rounded-sm"
          style={{ backgroundColor: theme.accentStrong }}
        />
        <div
          className="mt-1 h-[3px] w-2/5 rounded-sm"
          style={{ backgroundColor: theme.accent, opacity: 0.8 }}
        />
        <div className="mt-1 flex w-full justify-center gap-1">
          <span className="h-[2px] w-6 rounded-full bg-neutral-300" />
          <span className="h-[2px] w-6 rounded-full bg-neutral-300" />
          <span className="h-[2px] w-6 rounded-full bg-neutral-300" />
        </div>
        <div
          className="mt-1 h-[1.5px] w-1/3 rounded-full"
          style={{ backgroundColor: theme.accent }}
        />
      </div>
      <div className="mt-2.5 space-y-[3px]">
        <SectionStrip theme={theme} />
        <div className={bar("w-full")} />
        <div className={bar("w-11/12")} />
        <div className={bar("w-10/12")} />
        <div className="h-[3px]" />
        <SectionStrip theme={theme} />
        <div className={bar("w-full")} />
        <div className={bar("w-9/12")} />
      </div>
    </div>
  );
}

function SectionStrip({
  theme,
}: {
  theme: ReturnType<typeof getTemplateTheme>;
}) {
  if (theme.sectionTitleStyle === "accent-rule") {
    return (
      <div className="flex items-center gap-1">
        <span
          className="h-[2px] w-3 rounded-full"
          style={{ backgroundColor: theme.accent }}
        />
        <span
          className="h-[3px] w-6 rounded-sm"
          style={{ backgroundColor: theme.accentStrong }}
        />
        <span className="h-px flex-1 rounded-full bg-neutral-200" />
      </div>
    );
  }
  if (theme.sectionTitleStyle === "rule") {
    return (
      <div>
        <span
          className="block h-[3px] w-6 rounded-sm"
          style={{ backgroundColor: theme.accentStrong }}
        />
        <span
          className="mt-[1.5px] block h-px w-full"
          style={{ backgroundColor: theme.accent, opacity: 0.6 }}
        />
      </div>
    );
  }
  return (
    <div>
      <span
        className="block h-[3px] w-6 rounded-sm"
        style={{ backgroundColor: theme.accentStrong }}
      />
      <span className="mt-[1.5px] block h-px w-full bg-neutral-300" />
    </div>
  );
}

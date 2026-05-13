import { ResumePreviewMock } from "@/components/marketing/resume-preview-mock";
import { cn } from "@/lib/utils";

const SHOWCASE_CAPTION =
  "Decorative illustration of a resume layout shown on a phone screen and a desktop browser window. Content is placeholder, not a real person’s resume.";

/**
 * Premium-feel dual mockup: phone-first stack on small screens, side‑by‑side on large.
 * CSS-only (no raster images) for fast paint.
 */
export function HomeResumeShowcase({ className }: { className?: string }) {
  return (
    <figure className={cn("mx-auto w-full max-w-5xl", className)}>
      <div
        className="flex flex-col items-center gap-10 lg:flex-row lg:items-end lg:justify-center lg:gap-12"
        role="group"
        aria-label="Resume preview mockups for mobile and desktop"
      >
        {/* Phone */}
        <div className="relative flex w-full max-w-[min(100%,280px)] flex-col items-center lg:max-w-[300px]">
          <div className="relative w-full rounded-[1.85rem] border border-foreground/12 bg-gradient-to-b from-muted/80 to-muted/40 p-[10px] shadow-elevated ring-1 ring-foreground/[0.06]">
            <div className="mx-auto mb-2 h-5 w-16 rounded-full bg-foreground/10" aria-hidden />
            <div className="overflow-hidden rounded-[1.35rem] border border-border/60 bg-background shadow-inner">
              <ResumePreviewMock
                variant="modern"
                className="rounded-none border-0 p-3 shadow-none ring-0 sm:p-4"
                ariaLabel="Mobile-sized resume layout preview: name block, summary lines, and two experience columns as simplified placeholders."
              />
            </div>
          </div>
        </div>

        {/* Desktop browser */}
        <div className="relative w-full max-w-xl flex-1">
          <div className="overflow-hidden rounded-xl border border-border/80 bg-muted/30 shadow-elevated ring-1 ring-foreground/[0.04]">
            <div className="flex items-center gap-2 border-b border-border/70 bg-muted/50 px-3 py-2.5">
              <span className="flex gap-1.5" aria-hidden>
                <span className="size-2.5 rounded-full bg-foreground/15" />
                <span className="size-2.5 rounded-full bg-foreground/12" />
                <span className="size-2.5 rounded-full bg-foreground/10" />
              </span>
              <div className="mx-auto h-6 min-w-0 flex-1 max-w-md rounded-md bg-background/90 px-3 text-center text-[10px] font-medium leading-6 text-muted-foreground shadow-sm ring-1 ring-border/60">
                Preview — your resume
              </div>
            </div>
            <div className="bg-gradient-to-b from-background to-muted/15 p-3 sm:p-5">
              <ResumePreviewMock
                variant="classic"
                className="shadow-sm"
                ariaLabel="Desktop-sized resume layout preview: profile header, summary lines, and section blocks as simplified placeholders."
              />
            </div>
          </div>
        </div>
      </div>
      <figcaption className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
        {SHOWCASE_CAPTION}
      </figcaption>
    </figure>
  );
}

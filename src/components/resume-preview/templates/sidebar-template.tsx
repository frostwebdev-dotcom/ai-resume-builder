import type { CSSProperties } from "react";

import { ContactStack, PlaceholderName, type SectionTitleVariant } from "@/components/resume-preview/shared-parts";
import {
  SidebarTemplateMainBlocks,
  SidebarTemplateRailBlocks,
} from "@/components/resume-preview/ordered-body-blocks";
import type { ResumePreviewDocument } from "@/lib/resume-preview/model";
import type { ResumeStyleV1 } from "@/lib/resume-preview/resume-style";
import { mergeTemplateWithStyle } from "@/lib/resume-preview/resume-style";
import type { TemplateSlug } from "@/lib/resume-preview/template-ids";
import { getTemplateTheme } from "@/lib/resume-preview/template-theme";
import { nameShowsInResumeHeader } from "@/lib/resume-preview/name-placement";
import { mergeStudioPreviewSection } from "@/lib/resume-preview/studio-preview-focus";
import type { WizardEditorSectionId } from "@/lib/resume-wizard/types";
import { cn } from "@/lib/utils";

type Props = {
  doc: ResumePreviewDocument;
  slug: TemplateSlug;
  resumeStyle?: ResumeStyleV1 | null;
  className?: string;
  /** Highlights the preview region for the open studio accordion section. */
  studioFocusSection?: WizardEditorSectionId | null;
};

/**
 * Sidebar layout family. A tinted left rail carries identity (optional avatar),
 * contact, skills, and certifications; the right column is the ATS-linear body.
 *
 * Visual identity still comes entirely from the per-slug theme + user style
 * overrides — this component only provides the structural two-column scaffold.
 */
export function SidebarTemplate({
  doc,
  slug,
  resumeStyle = null,
  className,
  studioFocusSection = null,
}: Props) {
  const theme = getTemplateTheme(slug);
  const effective = mergeTemplateWithStyle(theme, resumeStyle);
  const sectionTitle: SectionTitleVariant = theme.sectionTitleStyle;
  const isSerif = effective.fontFamily === "serif";

  const paper = cn(
    "resume-paper relative box-border w-[210mm] max-w-full overflow-hidden bg-white text-neutral-900",
    /* A4 preview frame: always show standard page size in the browser; grows when content exceeds one page. */
    "min-h-[297mm] h-auto text-[10.5px] leading-relaxed",
    isSerif ? "font-serif" : "font-sans",
    "print:min-h-0 print:w-[210mm] print:shadow-none",
    className,
  );

  const sidebarStyle: CSSProperties = {
    backgroundColor: effective.accentStrong,
  };

  const avatarUrl = effective.showAvatar ? doc.identity.avatarUrl ?? null : null;
  const showNameInSidebarTitle = nameShowsInResumeHeader(doc.identity);

  return (
    <article className={paper} data-template={slug} data-layout-family="sidebar">
      <div className="grid min-h-[297mm] grid-cols-[minmax(0,34%)_minmax(0,1fr)] items-stretch">
        {/* ───── Left rail ───── */}
        <aside className="relative flex flex-col gap-5 p-[clamp(8mm,2.4vw,12mm)] text-white" style={sidebarStyle}>
          <div
            {...mergeStudioPreviewSection(
              "personal",
              studioFocusSection,
              "rail",
              "flex flex-col gap-5",
            )}
          >
            {avatarUrl ? (
              <div className="mx-auto">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={avatarUrl}
                  alt=""
                  aria-hidden
                  className="size-[26mm] rounded-full object-cover ring-2 ring-white/60"
                  style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.18)" }}
                />
              </div>
            ) : (
              <div className="mx-auto flex size-[26mm] items-center justify-center rounded-full bg-white/10 ring-2 ring-white/40 text-[1.2rem] font-semibold tracking-wider text-white/80">
                {initialsOf(doc.identity.fullName) || "—"}
              </div>
            )}

            <div className="text-center">
              {showNameInSidebarTitle ? (
                <>
                  <h1 className="text-[1.15rem] font-bold leading-tight tracking-tight [&_span.text-neutral-400]:text-white/65">
                    {doc.identity.fullName || <PlaceholderName>Your name</PlaceholderName>}
                  </h1>
                  {doc.identity.headline ? (
                    <p className="mt-1 text-[10.5px] font-medium opacity-90">
                      {doc.identity.headline}
                    </p>
                  ) : (
                    <p className="mt-1 text-[10.5px] opacity-70">Professional headline</p>
                  )}
                </>
              ) : doc.identity.headline ? (
                <h1 className="text-[1.15rem] font-bold leading-tight tracking-tight">
                  {doc.identity.headline}
                </h1>
              ) : (
                <h1 className="text-[1.15rem] font-bold text-white/70">Professional headline</h1>
              )}
            </div>

            <div
              aria-hidden
              className="mx-auto h-[1.5px] w-12 rounded-full opacity-80"
              style={{ backgroundColor: effective.accent }}
            />

            {doc.contact.lines.length > 0 || doc.personalOptionalLines.length > 0 ? (
              <section aria-label="Contact">
                <SidebarHeading accent={effective.accent}>Contact</SidebarHeading>
                {doc.contact.lines.length > 0 ? (
                  <ContactStack
                    lines={doc.contact.lines}
                    className="mt-2 space-y-1 text-[10px] text-white opacity-95 [&_a]:text-white [&_a]:underline-offset-2 hover:[&_a]:underline [&_span.text-neutral-500]:text-white/60"
                    accent="#ffffff"
                  />
                ) : null}
                {doc.personalOptionalLines.length > 0 ? (
                  <ContactStack
                    lines={doc.personalOptionalLines}
                    className="mt-2 space-y-1 text-[10px] text-white opacity-95 [&_a]:text-white [&_a]:underline-offset-2 hover:[&_a]:underline [&_span.text-neutral-500]:text-white/60"
                    accent="#ffffff"
                  />
                ) : null}
              </section>
            ) : null}
          </div>

          <SidebarTemplateRailBlocks
            doc={doc}
            accent={effective.accent}
            studioFocusSection={studioFocusSection}
          />
        </aside>

        {/* ───── Main column ───── */}
        <main
          className="p-[clamp(9mm,2.8vw,14mm)]"
          style={{
            textAlign: effective.bodyTextAlign,
            lineHeight: effective.lineHeight,
          }}
        >
          <SidebarTemplateMainBlocks
            doc={doc}
            sectionTitle={sectionTitle}
            accent={effective.accent}
            accentStrong={effective.accentStrong}
            sectionGapScale={effective.sectionGapScale}
            studioFocusSection={studioFocusSection}
          />
        </main>
      </div>
    </article>
  );
}

function SidebarHeading({ accent, children }: { accent: string; children: React.ReactNode }) {
  return (
    <h2
      className="flex items-center gap-2 text-[0.55rem] font-semibold uppercase tracking-[0.22em] text-white"
      aria-label={typeof children === "string" ? children : undefined}
    >
      <span
        aria-hidden
        className="inline-block h-[2px] w-4 rounded-full"
        style={{ backgroundColor: accent }}
      />
      <span>{children}</span>
    </h2>
  );
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
  return (first + last).toUpperCase();
}

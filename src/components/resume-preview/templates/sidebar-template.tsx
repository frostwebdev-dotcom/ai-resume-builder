import type { CSSProperties } from "react";

import {
  ContactStack,
  PlaceholderName,
  ResumeSectionTitle,
  type SectionTitleVariant,
} from "@/components/resume-preview/shared-parts";
import type {
  ResumePreviewDocument,
  ResumeSupplementarySection,
} from "@/lib/resume-preview/model";
import type { ResumeStyleV1 } from "@/lib/resume-preview/resume-style";
import { mergeTemplateWithStyle } from "@/lib/resume-preview/resume-style";
import type { TemplateSlug } from "@/lib/resume-preview/template-ids";
import { getTemplateTheme } from "@/lib/resume-preview/template-theme";
import { nameShowsInResumeHeader } from "@/lib/resume-preview/name-placement";
import { resumePageBreakBeforeClass } from "@/lib/resume-preview/page-breaks";
import { ResumeProfileSummary } from "@/components/resume-preview/resume-profile-summary";
import { cn } from "@/lib/utils";

type Props = {
  doc: ResumePreviewDocument;
  slug: TemplateSlug;
  resumeStyle?: ResumeStyleV1 | null;
  className?: string;
};

/**
 * Sidebar layout family. A tinted left rail carries identity (optional avatar),
 * contact, skills, and certifications; the right column is the ATS-linear body.
 *
 * Visual identity still comes entirely from the per-slug theme + user style
 * overrides — this component only provides the structural two-column scaffold.
 */
export function SidebarTemplate({ doc, slug, resumeStyle = null, className }: Props) {
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

  const hasCerts = doc.certifications.some((c) => c.name || c.issuer);
  const hasSkills = doc.skills.length > 0;

  return (
    <article className={paper} data-template={slug} data-layout-family="sidebar">
      <div className="grid min-h-[297mm] grid-cols-[minmax(0,34%)_minmax(0,1fr)] items-stretch">
        {/* ───── Left rail ───── */}
        <aside className="relative flex flex-col gap-5 p-[clamp(8mm,2.4vw,12mm)] text-white" style={sidebarStyle}>
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
                <h1 className="text-[1.15rem] font-bold leading-tight tracking-tight">
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
                  className="mt-2 space-y-1 text-[10px] opacity-95 [&_a]:text-white [&_a]:underline-offset-2 hover:[&_a]:underline [&_span.text-neutral-500]:text-white/60"
                  accent="#ffffff"
                />
              ) : null}
              {doc.personalOptionalLines.length > 0 ? (
                <ContactStack
                  lines={doc.personalOptionalLines}
                  className="mt-2 space-y-1 text-[10px] opacity-95 [&_a]:text-white [&_a]:underline-offset-2 hover:[&_a]:underline [&_span.text-neutral-500]:text-white/60"
                  accent="#ffffff"
                />
              ) : null}
            </section>
          ) : null}

          {hasSkills ? (
            <section
              aria-label="Skills"
              className={doc.pageBreakBefore?.skills ? resumePageBreakBeforeClass : undefined}
            >
              <SidebarHeading accent={effective.accent}>Skills</SidebarHeading>
              <ul className="mt-2 space-y-1 text-[10px]">
                {doc.skills.map((s, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span
                      aria-hidden
                      className="mt-[0.35em] inline-block size-1 shrink-0 rounded-full"
                      style={{ backgroundColor: effective.accent }}
                    />
                    <span className="opacity-95">{s}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {hasCerts ? (
            <section
              aria-label="Certifications"
              className={
                doc.pageBreakBefore?.certifications ? resumePageBreakBeforeClass : undefined
              }
            >
              <SidebarHeading accent={effective.accent}>Certifications</SidebarHeading>
              <ul className="mt-2 space-y-1.5 text-[10px]">
                {doc.certifications.map((c) => (
                  <li key={c.id}>
                    <span className="block font-medium">{c.name || "Certification"}</span>
                    {c.issuer ? <span className="block opacity-80">{c.issuer}</span> : null}
                    {c.dateLine ? (
                      <span className="block text-[9.5px] opacity-70 tabular-nums">{c.dateLine}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </aside>

        {/* ───── Main column ───── */}
        <main
          className="p-[clamp(9mm,2.8vw,14mm)]"
          style={{
            textAlign: effective.bodyTextAlign,
            lineHeight: effective.lineHeight,
          }}
        >
          <div
            className="flex flex-col"
            style={{
              gap: `${Math.round(18 * effective.sectionGapScale)}px`,
            }}
          >
            {doc.summary ? (
              <section
                className={cn(
                  "space-y-2",
                  doc.pageBreakBefore?.summary && resumePageBreakBeforeClass,
                )}
              >
                <ResumeSectionTitle variant={sectionTitle} accent={effective.accentStrong}>
                  Summary
                </ResumeSectionTitle>
                <ResumeProfileSummary text={doc.summary} />
              </section>
            ) : null}

            {doc.education.some((e) => e.school || e.degreeLine !== "Education") ? (
              <section
                className={cn(
                  "space-y-2",
                  doc.pageBreakBefore?.education && resumePageBreakBeforeClass,
                )}
              >
                <ResumeSectionTitle variant={sectionTitle} accent={effective.accentStrong}>
                  Education
                </ResumeSectionTitle>
                <ul className="space-y-2">
                  {doc.education.map((ed) => (
                    <li key={ed.id}>
                      <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
                        <div>
                          <span className="font-semibold">{ed.degreeLine}</span>
                          {ed.school ? (
                            <span className="text-neutral-800"> — {ed.school}</span>
                          ) : null}
                        </div>
                        {ed.dateRange ? (
                          <span className="shrink-0 text-[10px] text-neutral-600 tabular-nums">
                            {ed.dateRange}
                          </span>
                        ) : null}
                      </div>
                      {ed.details ? (
                        <p className="mt-1 text-neutral-700">{ed.details}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {doc.experience.some((e) => e.title || e.company || e.highlights.length) ? (
              <section
                className={cn(
                  "space-y-3",
                  doc.pageBreakBefore?.experience && resumePageBreakBeforeClass,
                )}
              >
                <ResumeSectionTitle variant={sectionTitle} accent={effective.accentStrong}>
                  Experience
                </ResumeSectionTitle>
                <ul className="space-y-4">
                  {doc.experience.map((ex) => (
                    <li
                      key={ex.id}
                      className="border-l-2 pl-3"
                      style={{ borderColor: effective.accent }}
                    >
                      <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between">
                        <div className="min-w-0">
                          <span className="font-semibold text-neutral-950">
                            {ex.title || "Role"}
                          </span>
                          {ex.company ? (
                            <span className="text-neutral-800"> — {ex.company}</span>
                          ) : null}
                          {ex.location ? (
                            <span className="text-neutral-600"> · {ex.location}</span>
                          ) : null}
                        </div>
                        {ex.dateRange ? (
                          <span className="shrink-0 text-[10px] text-neutral-600 tabular-nums">
                            {ex.dateRange}
                          </span>
                        ) : null}
                      </div>
                      {ex.highlights.length > 0 ? (
                        <ul
                          className="mt-2 list-outside list-disc space-y-1 pl-4"
                          style={{ ["--accent-marker" as string]: effective.accent }}
                        >
                          {ex.highlights.map((h, i) => (
                            <li key={i} className="marker:text-[var(--accent-marker)] pl-0.5">
                              {h}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {doc.supplementarySections.map((s) => (
              <SupplementarySidebarSection
                key={s.id}
                section={s}
                sectionTitle={sectionTitle}
                accentStrong={effective.accentStrong}
                pageBreakBefore={doc.pageBreakBefore}
              />
            ))}

            {doc.projects.some((p) => p.name || p.description) ? (
              <section
                className={cn(
                  "space-y-2",
                  doc.pageBreakBefore?.projects && resumePageBreakBeforeClass,
                )}
              >
                <ResumeSectionTitle variant={sectionTitle} accent={effective.accentStrong}>
                  Projects
                </ResumeSectionTitle>
                <ul className="space-y-2.5">
                  {doc.projects.map((p) => (
                    <li key={p.id}>
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <span className="font-semibold">{p.name || "Project"}</span>
                        {p.url ? (
                          <a
                            href={p.url.startsWith("http") ? p.url : `https://${p.url}`}
                            className="text-[10px] underline-offset-2 hover:underline"
                            style={{ color: effective.accent }}
                            rel="noopener noreferrer"
                            target="_blank"
                          >
                            {p.url}
                          </a>
                        ) : null}
                      </div>
                      {p.description ? (
                        <p className="mt-0.5 text-neutral-800">{p.description}</p>
                      ) : null}
                      {p.technologies ? (
                        <p className="mt-0.5 text-[10px] italic text-neutral-500">
                          Stack: {p.technologies}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {doc.additional ? (
              <section
                className={cn(
                  "space-y-2",
                  doc.pageBreakBefore?.additional && resumePageBreakBeforeClass,
                )}
              >
                <ResumeSectionTitle variant={sectionTitle} accent={effective.accentStrong}>
                  Additional
                </ResumeSectionTitle>
                <p className="whitespace-pre-wrap">{doc.additional}</p>
              </section>
            ) : null}
          </div>
        </main>
      </div>
    </article>
  );
}

function SupplementarySidebarSection({
  section,
  sectionTitle,
  accentStrong,
  pageBreakBefore,
}: {
  section: ResumeSupplementarySection;
  sectionTitle: SectionTitleVariant;
  accentStrong: string;
  pageBreakBefore: ResumePreviewDocument["pageBreakBefore"];
}) {
  const pb = pageBreakBefore?.[section.id];
  return (
    <section className={cn("space-y-2", pb && resumePageBreakBeforeClass)}>
      <ResumeSectionTitle variant={sectionTitle} accent={accentStrong}>
        {section.title}
      </ResumeSectionTitle>
      <p className="whitespace-pre-wrap text-neutral-800">{section.body}</p>
    </section>
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

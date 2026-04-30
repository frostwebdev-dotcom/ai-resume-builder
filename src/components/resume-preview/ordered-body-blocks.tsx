import { Fragment, type ReactNode } from "react";

import { ResumeProfileSummary } from "@/components/resume-preview/resume-profile-summary";
import {
  ResumeSectionTitle,
  type SectionTitleVariant,
} from "@/components/resume-preview/shared-parts";
import { resumePageBreakBeforeClass } from "@/lib/resume-preview/page-breaks";
import type {
  ResumePreviewBodyBlockId,
  ResumePreviewDocument,
  ResumeSupplementarySection,
} from "@/lib/resume-preview/model";
import { mergeStudioPreviewSection } from "@/lib/resume-preview/studio-preview-focus";
import type { WizardEditorSectionId } from "@/lib/resume-wizard/types";
import type { EffectiveResumeTheme } from "@/lib/resume-preview/resume-style";
import { cn } from "@/lib/utils";

type SidebarMainCtx = {
  doc: ResumePreviewDocument;
  sectionTitle: SectionTitleVariant;
  accent: string;
  accentStrong: string;
  sectionGapScale: number;
  /** Open studio accordion section — highlights matching preview block. */
  studioFocusSection?: WizardEditorSectionId | null;
};

/** Main column for sidebar layout (no skills / certifications — those render in the rail). */
export function SidebarTemplateMainBlocks({
  doc,
  sectionTitle,
  accent,
  accentStrong,
  sectionGapScale,
  studioFocusSection = null,
}: SidebarMainCtx) {
  const mainBlocks = doc.bodySectionOrder.filter(
    (b) => b !== "skills" && b !== "certifications",
  );

  return (
    <div
      className="flex flex-col"
      style={{
        gap: `${Math.round(18 * sectionGapScale)}px`,
      }}
    >
      {mainBlocks.map((blockId) => (
        <Fragment key={blockId}>
          {sidebarMainBlock(blockId, {
            doc,
            sectionTitle,
            accent,
            accentStrong,
            studioFocusSection,
          })}
        </Fragment>
      ))}
    </div>
  );
}

function sidebarMainBlock(
  blockId: ResumePreviewBodyBlockId,
  ctx: Pick<
    SidebarMainCtx,
    "doc" | "sectionTitle" | "accent" | "accentStrong" | "studioFocusSection"
  >,
): ReactNode {
  const { doc, sectionTitle, accent, accentStrong, studioFocusSection } = ctx;
  const pb = doc.pageBreakBefore;

  switch (blockId) {
    case "summary":
      return doc.summary ? (
        <section
          {...mergeStudioPreviewSection(
            "summary",
            studioFocusSection,
            "paper",
            cn("space-y-2", pb?.summary && resumePageBreakBeforeClass),
          )}
        >
          <ResumeSectionTitle variant={sectionTitle} accent={accentStrong}>
            Summary
          </ResumeSectionTitle>
          <ResumeProfileSummary text={doc.summary} />
        </section>
      ) : null;
    case "education":
      return doc.education.some((e) => e.school || e.degreeLine !== "Education") ? (
        <section
          {...mergeStudioPreviewSection(
            "education",
            studioFocusSection,
            "paper",
            cn("space-y-2", pb?.education && resumePageBreakBeforeClass),
          )}
        >
          <ResumeSectionTitle variant={sectionTitle} accent={accentStrong}>
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
      ) : null;
    case "experience":
      return doc.experience.some((e) => e.title || e.company || e.highlights.length) ? (
        <section
          {...mergeStudioPreviewSection(
            "experience",
            studioFocusSection,
            "paper",
            cn("space-y-3", pb?.experience && resumePageBreakBeforeClass),
          )}
        >
          <ResumeSectionTitle variant={sectionTitle} accent={accentStrong}>
            Experience
          </ResumeSectionTitle>
          <ul className="space-y-4">
            {doc.experience.map((ex) => (
              <li
                key={ex.id}
                className="border-l-2 pl-3"
                style={{ borderColor: accent }}
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
                    style={{ ["--accent-marker" as string]: accent }}
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
      ) : null;
    case "languages":
    case "hobbies":
    case "courses":
    case "internships": {
      const s = doc.supplementarySections.find((x) => x.id === blockId);
      return s ? (
        <SupplementarySidebarSection
          section={s}
          sectionTitle={sectionTitle}
          accentStrong={accentStrong}
          pageBreakBefore={doc.pageBreakBefore}
          studioFocusSection={studioFocusSection}
        />
      ) : null;
    }
    case "projects":
      return doc.projects.some((p) => p.name || p.description) ? (
        <section
          {...mergeStudioPreviewSection(
            "projects",
            studioFocusSection,
            "paper",
            cn("space-y-2", pb?.projects && resumePageBreakBeforeClass),
          )}
        >
          <ResumeSectionTitle variant={sectionTitle} accent={accentStrong}>
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
                      style={{ color: accent }}
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
      ) : null;
    case "additional":
      return doc.additional ? (
        <section
          {...mergeStudioPreviewSection(
            "additional",
            studioFocusSection,
            "paper",
            cn("space-y-2", pb?.additional && resumePageBreakBeforeClass),
          )}
        >
          <ResumeSectionTitle variant={sectionTitle} accent={accentStrong}>
            Additional
          </ResumeSectionTitle>
          <p className="whitespace-pre-wrap">{doc.additional}</p>
        </section>
      ) : null;
    default:
      return null;
  }
}

type SidebarRailCtx = {
  doc: ResumePreviewDocument;
  accent: string;
  studioFocusSection?: WizardEditorSectionId | null;
};

/** Left-rail skills / certifications in studio order. */
export function SidebarTemplateRailBlocks({
  doc,
  accent,
  studioFocusSection = null,
}: SidebarRailCtx) {
  const railBlocks = doc.bodySectionOrder.filter(
    (b) => b === "skills" || b === "certifications",
  );
  const hasSkills = doc.skills.length > 0;
  const hasCerts = doc.certifications.some((c) => c.name || c.issuer);

  return (
    <>
      {railBlocks.map((rid) => {
        if (rid === "skills" && hasSkills) {
          return (
            <section
              key="skills"
              aria-label="Skills"
              {...mergeStudioPreviewSection(
                "skills",
                studioFocusSection,
                "rail",
                doc.pageBreakBefore?.skills ? resumePageBreakBeforeClass : undefined,
              )}
            >
              <SidebarRailHeading accent={accent}>Skills</SidebarRailHeading>
              <ul className="mt-2 space-y-1 text-[10px]">
                {doc.skills.map((s, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span
                      aria-hidden
                      className="mt-[0.35em] inline-block size-1 shrink-0 rounded-full"
                      style={{ backgroundColor: accent }}
                    />
                    <span className="opacity-95">{s}</span>
                  </li>
                ))}
              </ul>
            </section>
          );
        }
        if (rid === "certifications" && hasCerts) {
          return (
            <section
              key="certifications"
              aria-label="Certifications"
              {...mergeStudioPreviewSection(
                "certifications",
                studioFocusSection,
                "rail",
                doc.pageBreakBefore?.certifications
                  ? resumePageBreakBeforeClass
                  : undefined,
              )}
            >
              <SidebarRailHeading accent={accent}>Certifications</SidebarRailHeading>
              <ul className="mt-2 space-y-1.5 text-[10px]">
                {doc.certifications.map((c) => (
                  <li key={c.id}>
                    <span className="block font-medium">{c.name || "Certification"}</span>
                    {c.issuer ? <span className="block opacity-80">{c.issuer}</span> : null}
                    {c.dateLine ? (
                      <span className="block text-[9.5px] opacity-70 tabular-nums">
                        {c.dateLine}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          );
        }
        return null;
      })}
    </>
  );
}

function SidebarRailHeading({
  accent,
  children,
}: {
  accent: string;
  children: React.ReactNode;
}) {
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

function SupplementarySidebarSection({
  section,
  sectionTitle,
  accentStrong,
  pageBreakBefore,
  studioFocusSection = null,
}: {
  section: ResumeSupplementarySection;
  sectionTitle: SectionTitleVariant;
  accentStrong: string;
  pageBreakBefore: ResumePreviewDocument["pageBreakBefore"];
  studioFocusSection?: WizardEditorSectionId | null;
}) {
  const pb = pageBreakBefore?.[section.id];
  return (
    <section
      {...mergeStudioPreviewSection(
        section.id,
        studioFocusSection,
        "paper",
        cn("space-y-2", pb && resumePageBreakBeforeClass),
      )}
    >
      <ResumeSectionTitle variant={sectionTitle} accent={accentStrong}>
        {section.title}
      </ResumeSectionTitle>
      <p className="whitespace-pre-wrap text-neutral-800">{section.body}</p>
    </section>
  );
}

type ThemedDensity = "compact" | "comfortable" | "airy";

type ThemedBodyCtx = {
  doc: ResumePreviewDocument;
  sectionTitle: SectionTitleVariant;
  effective: EffectiveResumeTheme;
  density: ThemedDensity;
  bulletIndent: string;
  accent: string;
  accentStrong: string;
  studioFocusSection?: WizardEditorSectionId | null;
};

export function ThemedTemplateBodyBlocks({
  doc,
  sectionTitle,
  effective,
  density,
  topGap,
  studioFocusSection = null,
}: {
  doc: ResumePreviewDocument;
  sectionTitle: SectionTitleVariant;
  effective: EffectiveResumeTheme;
  density: ThemedDensity;
  topGap?: string;
  studioFocusSection?: WizardEditorSectionId | null;
}) {
  const baseGap =
    density === "compact" ? 10 : density === "airy" ? 22 : 18;
  const sectionGapPx = Math.round(baseGap * effective.sectionGapScale);
  const bulletIndent = density === "compact" ? "pl-3.5" : "pl-4";
  const accent = effective.accent;
  const accentStrong = effective.accentStrong;
  const ctx: ThemedBodyCtx = {
    doc,
    sectionTitle,
    effective,
    density,
    bulletIndent,
    accent,
    accentStrong,
    studioFocusSection,
  };

  return (
    <div
      className={cn(topGap ?? (density === "compact" ? "mt-2.5" : "mt-5"), "flex flex-col")}
      style={{
        gap: `${sectionGapPx}px`,
        textAlign: effective.bodyTextAlign,
        lineHeight: effective.lineHeight,
      }}
    >
      {doc.bodySectionOrder.map((blockId) => (
        <Fragment key={blockId}>{themedBodyBlock(blockId, ctx)}</Fragment>
      ))}
    </div>
  );
}

function themedBodyBlock(blockId: ResumePreviewBodyBlockId, ctx: ThemedBodyCtx): ReactNode {
  const {
    doc,
    sectionTitle,
    effective,
    density,
    bulletIndent,
    accent,
    accentStrong,
    studioFocusSection,
  } = ctx;
  const pb = doc.pageBreakBefore;

  switch (blockId) {
    case "summary":
      return doc.summary ? (
        <section
          {...mergeStudioPreviewSection(
            "summary",
            studioFocusSection,
            "paper",
            cn("space-y-2", pb?.summary && resumePageBreakBeforeClass),
          )}
          style={{ lineHeight: effective.lineHeight }}
        >
          <ResumeSectionTitle variant={sectionTitle} accent={accentStrong}>
            Summary
          </ResumeSectionTitle>
          <ResumeProfileSummary text={doc.summary} />
        </section>
      ) : null;
    case "education":
      return doc.education.some((e) => e.school || e.degreeLine !== "Education") ? (
        <section
          {...mergeStudioPreviewSection(
            "education",
            studioFocusSection,
            "paper",
            cn("space-y-2", pb?.education && resumePageBreakBeforeClass),
          )}
        >
          <ResumeSectionTitle variant={sectionTitle} accent={accentStrong}>
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
      ) : null;
    case "experience":
      return doc.experience.some((e) => e.title || e.company || e.highlights.length) ? (
        <section
          {...mergeStudioPreviewSection(
            "experience",
            studioFocusSection,
            "paper",
            cn("space-y-3", pb?.experience && resumePageBreakBeforeClass),
          )}
          style={{ lineHeight: effective.lineHeight }}
        >
          <ResumeSectionTitle variant={sectionTitle} accent={accentStrong}>
            Experience
          </ResumeSectionTitle>
          <ul className={density === "compact" ? "space-y-2.5" : "space-y-4"}>
            {doc.experience.map((ex) => (
              <li
                key={ex.id}
                className={
                  sectionTitle === "accent-rule" ? "border-l-2 pl-3" : undefined
                }
                style={
                  sectionTitle === "accent-rule"
                    ? { borderColor: accent }
                    : undefined
                }
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
                    className={cn(
                      "mt-2 list-outside list-disc space-y-1",
                      bulletIndent,
                    )}
                    style={{ ["--accent-marker" as string]: accent }}
                  >
                    {ex.highlights.map((h, i) => (
                      <li
                        key={i}
                        className="marker:text-[var(--accent-marker)] pl-0.5"
                      >
                        {h}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null;
    case "skills":
      return doc.skills.length > 0 ? (
        <section
          {...mergeStudioPreviewSection(
            "skills",
            studioFocusSection,
            "paper",
            cn("space-y-2", pb?.skills && resumePageBreakBeforeClass),
          )}
        >
          <ResumeSectionTitle variant={sectionTitle} accent={accentStrong}>
            Skills
          </ResumeSectionTitle>
          <p
            className={cn(
              "text-neutral-800",
              density === "compact" ? "text-[10.5px] leading-snug" : undefined,
            )}
          >
            {doc.skills.join(" · ")}
          </p>
        </section>
      ) : null;
    case "languages":
    case "hobbies":
    case "courses":
    case "internships": {
      const s = doc.supplementarySections.find((x) => x.id === blockId);
      return s ? (
        <ThemedSupplementarySection
          section={s}
          sectionTitle={sectionTitle}
          accentStrong={accentStrong}
          pageBreakBefore={doc.pageBreakBefore}
          studioFocusSection={studioFocusSection}
        />
      ) : null;
    }
    case "certifications":
      return doc.certifications.some((c) => c.name || c.issuer) ? (
        <section
          {...mergeStudioPreviewSection(
            "certifications",
            studioFocusSection,
            "paper",
            cn("space-y-2", pb?.certifications && resumePageBreakBeforeClass),
          )}
        >
          <ResumeSectionTitle variant={sectionTitle} accent={accentStrong}>
            Certifications
          </ResumeSectionTitle>
          <ul className={density === "compact" ? "space-y-1 text-[10.5px]" : "space-y-1"}>
            {doc.certifications.map((c) => (
              <li key={c.id} className="flex flex-wrap justify-between gap-2">
                <span>
                  <span className="font-medium">{c.name || "Certification"}</span>
                  {c.issuer ? (
                    <span className="text-neutral-700"> — {c.issuer}</span>
                  ) : null}
                </span>
                {c.dateLine ? (
                  <span
                    className={cn(
                      "text-neutral-600 tabular-nums",
                      density === "compact" ? "text-[9.5px]" : "text-[10px]",
                    )}
                  >
                    {c.dateLine}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null;
    case "projects":
      return doc.projects.some((p) => p.name || p.description) ? (
        <section
          {...mergeStudioPreviewSection(
            "projects",
            studioFocusSection,
            "paper",
            cn("space-y-2", pb?.projects && resumePageBreakBeforeClass),
          )}
        >
          <ResumeSectionTitle variant={sectionTitle} accent={accentStrong}>
            Projects
          </ResumeSectionTitle>
          <ul className={density === "compact" ? "space-y-1.5" : "space-y-2.5"}>
            {doc.projects.map((p) => (
              <li key={p.id}>
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-semibold">{p.name || "Project"}</span>
                  {p.url ? (
                    <a
                      href={p.url.startsWith("http") ? p.url : `https://${p.url}`}
                      className="text-[10px] underline-offset-2 hover:underline"
                      style={{ color: accent }}
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
      ) : null;
    case "additional":
      return doc.additional ? (
        <section
          {...mergeStudioPreviewSection(
            "additional",
            studioFocusSection,
            "paper",
            cn("space-y-2", pb?.additional && resumePageBreakBeforeClass),
          )}
        >
          <ResumeSectionTitle variant={sectionTitle} accent={accentStrong}>
            Additional
          </ResumeSectionTitle>
          <p className="whitespace-pre-wrap">{doc.additional}</p>
        </section>
      ) : null;
    default:
      return null;
  }
}

function ThemedSupplementarySection({
  section,
  sectionTitle,
  accentStrong,
  pageBreakBefore,
  studioFocusSection = null,
}: {
  section: ResumeSupplementarySection;
  sectionTitle: SectionTitleVariant;
  accentStrong: string;
  pageBreakBefore: ResumePreviewDocument["pageBreakBefore"];
  studioFocusSection?: WizardEditorSectionId | null;
}) {
  const pb = pageBreakBefore?.[section.id];
  return (
    <section
      {...mergeStudioPreviewSection(
        section.id,
        studioFocusSection,
        "paper",
        cn("space-y-2", pb && resumePageBreakBeforeClass),
      )}
    >
      <ResumeSectionTitle variant={sectionTitle} accent={accentStrong}>
        {section.title}
      </ResumeSectionTitle>
      <p className="whitespace-pre-wrap text-neutral-800">{section.body}</p>
    </section>
  );
}

import {
  ContactInline,
  ContactStack,
  PlaceholderName,
  ResumeSectionTitle,
  type SectionTitleVariant,
} from "@/components/resume-preview/shared-parts";
import type { ResumePreviewDocument } from "@/lib/resume-preview/model";
import type { ResumeStyleV1 } from "@/lib/resume-preview/resume-style";
import {
  mergeTemplateWithStyle,
  type EffectiveResumeTheme,
} from "@/lib/resume-preview/resume-style";
import type { TemplateSlug } from "@/lib/resume-preview/template-ids";
import { getTemplateTheme, type TemplateTheme } from "@/lib/resume-preview/template-theme";
import { nameShowsInResumeHeader } from "@/lib/resume-preview/name-placement";
import { resumePageBreakBeforeClass } from "@/lib/resume-preview/page-breaks";
import { ResumeProfileSummary } from "@/components/resume-preview/resume-profile-summary";
import { cn } from "@/lib/utils";

type Props = {
  doc: ResumePreviewDocument;
  slug: TemplateSlug;
  /** Saved per-project overrides (colors, type, spacing). */
  resumeStyle?: ResumeStyleV1 | null;
  className?: string;
};

function headerAlignClass(ha: EffectiveResumeTheme["headerTextAlign"]): string {
  if (ha === "center") return "text-center";
  if (ha === "right") return "text-right";
  return "text-left";
}

type Density = "compact" | "comfortable" | "airy";

function densityOf(theme: TemplateTheme): Density {
  if (theme.type.body < 10) return "compact";
  if (theme.rhythm.sectionGap >= 13) return "airy";
  return "comfortable";
}

/**
 * Single themed preview component used for every template slug.
 * Visual choices — colors, font, header composition, section titles,
 * density, two-column meta — are all driven by the theme returned by
 * `getTemplateTheme`. Add a new template by adding a row to
 * `template-theme.ts`; no code changes here.
 */
export function ThemedTemplate({ doc, slug, resumeStyle = null, className }: Props) {
  const theme = getTemplateTheme(slug);
  const effective = mergeTemplateWithStyle(theme, resumeStyle);
  const density = densityOf(theme);
  const sectionTitle: SectionTitleVariant = theme.sectionTitleStyle;
  const isSerif = effective.fontFamily === "serif";
  const isBanner = theme.headerStyle === "banner";

  const paperClasses = cn(
    "resume-paper relative box-border w-[210mm] max-w-full overflow-hidden bg-white text-neutral-900 print:min-h-0 print:w-[210mm] print:shadow-none",
    /* A4 preview frame for all densities: standard on-screen page even with little content. */
    "min-h-[297mm] h-auto",
    density === "compact"
      ? "text-[9.75px] leading-snug"
      : density === "airy"
        ? "text-[11px] leading-relaxed"
        : "text-[11px] leading-relaxed",
    isSerif ? "font-serif" : "font-sans",
    className,
  );

  const padX =
    density === "compact"
      ? "px-[clamp(8mm,2.2vw,10mm)]"
      : density === "airy"
        ? "px-[clamp(11mm,3.2vw,15mm)]"
        : "px-[clamp(10mm,3vw,14mm)]";
  const padY =
    density === "compact"
      ? "py-[clamp(8mm,2.2vw,10mm)]"
      : density === "airy"
        ? "py-[clamp(11mm,3.2vw,15mm)]"
        : "py-[clamp(10mm,3vw,14mm)]";

  return (
    <article className={paperClasses} data-template={slug}>
      {isBanner ? (
        <div
          className={cn("w-full text-white", padX, "pt-[clamp(10mm,3vw,14mm)]", "pb-5")}
          style={{ backgroundColor: effective.accentStrong }}
        >
          <div
            className={cn(
              "flex items-center gap-5",
              effective.headerTextAlign === "center" && "justify-center text-center",
              effective.headerTextAlign === "right" && "justify-end text-right",
              effective.headerTextAlign === "left" && "text-left",
            )}
          >
            {effective.showAvatar && doc.identity.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={doc.identity.avatarUrl}
                alt=""
                aria-hidden
                className="size-[22mm] shrink-0 rounded-full object-cover ring-2 ring-white/60"
                style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.2)" }}
              />
            ) : null}
            <div className={cn("min-w-0", headerAlignClass(effective.headerTextAlign))}>
              <BannerTitleBlock doc={doc} />
              <ContactInline
                lines={doc.contact.lines}
                className="mt-2 text-[10.5px] leading-snug opacity-90"
                accent="#ffffff"
              />
            </div>
          </div>
          <div
            aria-hidden
            className={cn(
              "mt-3 h-[2px] w-16 rounded-full",
              effective.headerTextAlign === "center" && "mx-auto",
              effective.headerTextAlign === "right" && "ml-auto",
            )}
            style={{ backgroundColor: effective.accent }}
          />
        </div>
      ) : null}

      <div className={cn(padX, !isBanner && padY, isBanner && "pt-6 pb-[clamp(10mm,3vw,14mm)]")}>
        {!isBanner ? <Header doc={doc} theme={theme} effective={effective} /> : null}
        <Body
          doc={doc}
          theme={theme}
          effective={effective}
          sectionTitle={sectionTitle}
          topGap={isBanner ? "mt-0" : undefined}
        />
      </div>
    </article>
  );
}

function BannerTitleBlock({ doc }: { doc: ResumePreviewDocument }) {
  const showName = nameShowsInResumeHeader(doc.identity);
  const name = doc.identity.fullName?.trim();
  const headline = doc.identity.headline?.trim();
  if (showName) {
    return (
      <>
        <h1 className="text-[1.55rem] font-bold leading-tight tracking-tight">
          {name ? name : <PlaceholderName>Your name</PlaceholderName>}
        </h1>
        {headline ? (
          <p
            className="mt-1 text-[13px] font-medium opacity-90"
            style={{ color: "#e5e7eb" }}
          >
            {headline}
          </p>
        ) : null}
      </>
    );
  }
  return headline ? (
    <h1 className="text-[1.55rem] font-bold leading-tight tracking-tight text-white/95">{headline}</h1>
  ) : (
    <h1 className="text-[1.55rem] font-bold leading-tight tracking-tight text-white/70">
      Professional headline
    </h1>
  );
}

function Header({
  doc,
  theme,
  effective,
}: {
  doc: ResumePreviewDocument;
  theme: TemplateTheme;
  effective: EffectiveResumeTheme;
}) {
  const showName = nameShowsInResumeHeader(doc.identity);
  const name = doc.identity.fullName || null;
  const headline = doc.identity.headline;
  const ha = effective.headerTextAlign;
  const contactAlign =
    ha === "center" ? "sm:text-center" : ha === "right" ? "sm:text-right" : "sm:text-left";

  if (theme.headerStyle === "centered") {
    return (
      <header className={headerAlignClass(ha)}>
        {showName ? (
          <h1
            className="text-[1.55rem] font-bold tracking-[0.01em]"
            style={{ color: effective.accentStrong }}
          >
            {name ? name : <PlaceholderName>Your name</PlaceholderName>}
          </h1>
        ) : (
          <h1
            className="text-[1.55rem] font-bold tracking-[0.01em]"
            style={{ color: effective.accentStrong }}
          >
            {headline ? headline : "Professional headline"}
          </h1>
        )}
        {showName ? (
          headline ? (
            <p
              className="mt-2 text-[0.85rem] font-medium tracking-wide"
              style={{ color: effective.accent }}
            >
              {headline}
            </p>
          ) : (
            <p className="mt-2 text-[0.85rem] text-neutral-400">Professional headline</p>
          )
        ) : null}
        <ContactInline
          lines={doc.contact.lines}
          className="mt-2 text-[10.5px] leading-snug text-neutral-600"
          accent={effective.accent}
        />
        <div
          className={cn(
            "mt-3 h-[1.25px] w-1/3",
            ha === "center" && "mx-auto",
            ha === "right" && "ml-auto",
          )}
          style={{ backgroundColor: effective.accent }}
        />
      </header>
    );
  }

  if (theme.headerStyle === "split") {
    return (
      <>
        <header className="grid gap-4 pb-3 sm:grid-cols-[1.15fr_0.85fr] sm:items-start sm:gap-8">
          <div className={cn("min-w-0", headerAlignClass(ha))}>
            {showName ? (
              <h1
                className="text-[1.45rem] font-bold leading-tight tracking-tight"
                style={{ color: effective.accentStrong }}
              >
                {name ? name : <PlaceholderName>Your name</PlaceholderName>}
              </h1>
            ) : (
              <h1
                className="text-[1.45rem] font-bold leading-tight tracking-tight"
                style={{ color: effective.accentStrong }}
              >
                {headline ? headline : "Professional headline"}
              </h1>
            )}
            {showName ? (
              headline ? (
                <p
                  className="mt-1 text-[13px] font-medium leading-snug"
                  style={{ color: effective.accent }}
                >
                  {headline}
                </p>
              ) : (
                <p className="mt-1 text-[13px] text-neutral-400">Professional headline</p>
              )
            ) : null}
          </div>
          <div className={cn("text-[10.5px] leading-relaxed sm:text-[11px]", contactAlign)}>
            <ContactStack
              lines={doc.contact.lines}
              className={cn(
                ha === "right" && "sm:ml-auto sm:max-w-[16rem]",
                ha === "center" && "sm:mx-auto sm:max-w-[16rem]",
                ha === "left" && "sm:mr-auto sm:max-w-[16rem]",
              )}
              accent={effective.accent}
            />
          </div>
        </header>
        <div className="flex items-center gap-2" aria-hidden>
          <span
            className="h-[2.5px] w-11 rounded-full"
            style={{ backgroundColor: effective.accent }}
          />
          <span className="h-px flex-1 bg-neutral-200 print:bg-neutral-300" />
        </div>
      </>
    );
  }

  /* compact */
  return (
    <header className={headerAlignClass(ha)}>
      {showName ? (
        <h1
          className="text-[1.15rem] font-bold leading-tight tracking-tight"
          style={{ color: effective.accentStrong }}
        >
          {name ? name : <PlaceholderName>Your name</PlaceholderName>}
        </h1>
      ) : (
        <h1
          className="text-[1.15rem] font-bold leading-tight tracking-tight"
          style={{ color: effective.accentStrong }}
        >
          {headline ? headline : "Professional headline"}
        </h1>
      )}
      {showName ? (
        headline ? (
          <p className="mt-0.5 text-[11px] font-medium" style={{ color: effective.accent }}>
            {headline}
          </p>
        ) : (
          <p className="mt-0.5 text-[11px] text-neutral-400">Professional headline</p>
        )
      ) : null}
      <ContactInline
        lines={doc.contact.lines}
        className="mt-1 text-[9.75px] leading-snug text-neutral-700"
        accent={effective.accent}
      />
      <div
        aria-hidden
        className="mt-2 h-px w-full"
        style={{ backgroundColor: effective.accent, opacity: 0.5 }}
      />
    </header>
  );
}

function Body({
  doc,
  theme,
  effective,
  sectionTitle,
  topGap,
}: {
  doc: ResumePreviewDocument;
  theme: TemplateTheme;
  effective: EffectiveResumeTheme;
  sectionTitle: SectionTitleVariant;
  topGap?: string;
}) {
  const density = densityOf(theme);
  const baseGap =
    density === "compact" ? 10 : density === "airy" ? 22 : 18;
  const sectionGapPx = Math.round(baseGap * effective.sectionGapScale);
  const bulletIndent = density === "compact" ? "pl-3.5" : "pl-4";
  const accent = effective.accent;
  const accentStrong = effective.accentStrong;
  const twoCol = theme.twoColumnMeta;

  return (
    <div
      className={cn(topGap ?? (density === "compact" ? "mt-2.5" : "mt-5"), "flex flex-col")}
      style={{
        gap: `${sectionGapPx}px`,
        textAlign: effective.bodyTextAlign,
        lineHeight: effective.lineHeight,
      }}
    >
      {doc.summary ? (
        <section
          className={cn(
            "space-y-2",
            doc.pageBreakBefore?.summary && resumePageBreakBeforeClass,
          )}
          style={{ lineHeight: effective.lineHeight }}
        >
          <ResumeSectionTitle variant={sectionTitle} accent={accentStrong}>
            Summary
          </ResumeSectionTitle>
          <ResumeProfileSummary text={doc.summary} />
        </section>
      ) : null}

      {doc.experience.some((e) => e.title || e.company || e.highlights.length) ? (
        <section
          className={cn(
            "space-y-3",
            doc.pageBreakBefore?.experience && resumePageBreakBeforeClass,
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
      ) : null}

      {doc.education.some((e) => e.school || e.degreeLine !== "Education") ? (
        <section
          className={cn("space-y-2", doc.pageBreakBefore?.education && resumePageBreakBeforeClass)}
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
                    {ed.school ? <span className="text-neutral-800"> — {ed.school}</span> : null}
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

      {twoCol ? (
        <div className="grid gap-5 sm:grid-cols-2 sm:gap-6">
          {doc.skills.length > 0 ? (
            <section
              className={cn("space-y-2", doc.pageBreakBefore?.skills && resumePageBreakBeforeClass)}
            >
              <ResumeSectionTitle variant={sectionTitle} accent={accentStrong}>
                Skills
              </ResumeSectionTitle>
              <p className="text-[10.5px] leading-snug text-neutral-800">
                {doc.skills.join(" · ")}
              </p>
            </section>
          ) : null}
          {doc.certifications.some((c) => c.name || c.issuer) ? (
            <section
              className={cn(
                "space-y-2",
                doc.pageBreakBefore?.certifications && resumePageBreakBeforeClass,
              )}
            >
              <ResumeSectionTitle variant={sectionTitle} accent={accentStrong}>
                Certifications
              </ResumeSectionTitle>
              <ul className="space-y-1 text-[10.5px]">
                {doc.certifications.map((c) => (
                  <li key={c.id} className="flex flex-wrap justify-between gap-2">
                    <span>
                      <span className="font-medium">{c.name || "Certification"}</span>
                      {c.issuer ? <span className="text-neutral-700"> — {c.issuer}</span> : null}
                    </span>
                    {c.dateLine ? (
                      <span className="text-[9.5px] text-neutral-600 tabular-nums">
                        {c.dateLine}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      ) : (
        <>
          {doc.skills.length > 0 ? (
            <section
              className={cn("space-y-2", doc.pageBreakBefore?.skills && resumePageBreakBeforeClass)}
            >
              <ResumeSectionTitle variant={sectionTitle} accent={accentStrong}>
                Skills
              </ResumeSectionTitle>
              <p className="text-neutral-800">{doc.skills.join(" · ")}</p>
            </section>
          ) : null}
          {doc.certifications.some((c) => c.name || c.issuer) ? (
            <section
              className={cn(
                "space-y-2",
                doc.pageBreakBefore?.certifications && resumePageBreakBeforeClass,
              )}
            >
              <ResumeSectionTitle variant={sectionTitle} accent={accentStrong}>
                Certifications
              </ResumeSectionTitle>
              <ul className="space-y-1">
                {doc.certifications.map((c) => (
                  <li key={c.id} className="flex flex-wrap justify-between gap-2">
                    <span>
                      <span className="font-medium">{c.name || "Certification"}</span>
                      {c.issuer ? <span className="text-neutral-700"> — {c.issuer}</span> : null}
                    </span>
                    {c.dateLine ? (
                      <span className="text-[10px] text-neutral-600 tabular-nums">
                        {c.dateLine}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      )}

      {doc.projects.some((p) => p.name || p.description) ? (
        <section
          className={cn("space-y-2", doc.pageBreakBefore?.projects && resumePageBreakBeforeClass)}
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
      ) : null}

      {doc.additional ? (
        <section
          className={cn("space-y-2", doc.pageBreakBefore?.additional && resumePageBreakBeforeClass)}
        >
          <ResumeSectionTitle variant={sectionTitle} accent={accentStrong}>
            Additional
          </ResumeSectionTitle>
          <p className="whitespace-pre-wrap">{doc.additional}</p>
        </section>
      ) : null}
    </div>
  );
}

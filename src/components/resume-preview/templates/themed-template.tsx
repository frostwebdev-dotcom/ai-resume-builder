import {
  ContactInline,
  ContactStack,
  PlaceholderName,
  type SectionTitleVariant,
} from "@/components/resume-preview/shared-parts";
import { ThemedTemplateBodyBlocks } from "@/components/resume-preview/ordered-body-blocks";
import type { ResumePreviewDocument } from "@/lib/resume-preview/model";
import type { ResumeStyleV1 } from "@/lib/resume-preview/resume-style";
import {
  mergeTemplateWithStyle,
  type EffectiveResumeTheme,
} from "@/lib/resume-preview/resume-style";
import type { TemplateSlug } from "@/lib/resume-preview/template-ids";
import { getTemplateTheme, type TemplateTheme } from "@/lib/resume-preview/template-theme";
import { nameShowsInResumeHeader } from "@/lib/resume-preview/name-placement";
import { mergeStudioPreviewSection } from "@/lib/resume-preview/studio-preview-focus";
import type { WizardEditorSectionId } from "@/lib/resume-wizard/types";
import { cn } from "@/lib/utils";

type Props = {
  doc: ResumePreviewDocument;
  slug: TemplateSlug;
  /** Saved per-project overrides (colors, type, spacing). */
  resumeStyle?: ResumeStyleV1 | null;
  className?: string;
  studioFocusSection?: WizardEditorSectionId | null;
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
 * `getTemplateTheme` (launch catalog in `template-theme.ts`). Structural variants
 * (sidebar / banner) remain supported for future templates.
 */
export function ThemedTemplate({
  doc,
  slug,
  resumeStyle = null,
  className,
  studioFocusSection = null,
}: Props) {
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
          {...mergeStudioPreviewSection(
            "personal",
            studioFocusSection,
            "rail",
            cn("w-full text-white", padX, "pt-[clamp(10mm,3vw,14mm)]", "pb-5"),
          )}
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
              {doc.personalOptionalLines.length > 0 ? (
                <ContactStack
                  lines={doc.personalOptionalLines}
                  className="mt-2 space-y-0.5 text-[10px] leading-snug opacity-90 [&_span.text-neutral-500]:text-white/65"
                  accent="#ffffff"
                />
              ) : null}
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
        {!isBanner ? (
          <div
            {...mergeStudioPreviewSection(
              "personal",
              studioFocusSection,
              "paper",
              undefined,
            )}
          >
            <Header doc={doc} theme={theme} effective={effective} />
          </div>
        ) : null}
        <Body
          doc={doc}
          theme={theme}
          effective={effective}
          sectionTitle={sectionTitle}
          topGap={isBanner ? "mt-0" : undefined}
          studioFocusSection={studioFocusSection}
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
        {doc.personalOptionalLines.length > 0 ? (
          <ContactStack
            lines={doc.personalOptionalLines}
            className="mt-2 text-[10px] leading-snug text-neutral-600"
            accent={effective.accent}
          />
        ) : null}
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
            {doc.personalOptionalLines.length > 0 ? (
              <ContactStack
                lines={doc.personalOptionalLines}
                className={cn(
                  "mt-2 text-[10px] leading-relaxed sm:text-[11px]",
                  ha === "right" && "sm:ml-auto sm:max-w-[16rem]",
                  ha === "center" && "sm:mx-auto sm:max-w-[16rem]",
                  ha === "left" && "sm:mr-auto sm:max-w-[16rem]",
                )}
                accent={effective.accent}
              />
            ) : null}
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
      {doc.personalOptionalLines.length > 0 ? (
        <ContactStack
          lines={doc.personalOptionalLines}
          className="mt-1.5 text-[9.75px] leading-snug text-neutral-700"
          accent={effective.accent}
        />
      ) : null}
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
  studioFocusSection = null,
}: {
  doc: ResumePreviewDocument;
  theme: TemplateTheme;
  effective: EffectiveResumeTheme;
  sectionTitle: SectionTitleVariant;
  topGap?: string;
  studioFocusSection?: WizardEditorSectionId | null;
}) {
  const density = densityOf(theme);
  return (
    <ThemedTemplateBodyBlocks
      doc={doc}
      sectionTitle={sectionTitle}
      effective={effective}
      density={density}
      topGap={topGap}
      studioFocusSection={studioFocusSection}
    />
  );
}

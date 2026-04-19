import {
  ContactInline,
  PlaceholderName,
  ResumeSectionTitle,
} from "@/components/resume-preview/shared-parts";
import type { ResumePreviewDocument } from "@/lib/resume-preview/model";
import { getTemplateTheme } from "@/lib/resume-preview/template-theme";
import { cn } from "@/lib/utils";

type Props = {
  doc: ResumePreviewDocument;
  className?: string;
};

/**
 * Nova — compact technical density. Tight rhythm for long histories,
 * strictly linear content order for ATS parsers. Projects reveal stack.
 */
export function TemplateNova({ doc, className }: Props) {
  const t = getTemplateTheme("nova");
  const name = doc.identity.fullName || null;

  return (
    <article
      className={cn(
        "resume-paper box-border min-h-[min(260mm,75vh)] w-full max-w-[210mm] bg-white p-[clamp(8mm,2.2vw,10mm)] text-[9.75px] leading-snug text-neutral-900 print:min-h-0 print:w-[210mm]",
        className,
      )}
      data-template="nova"
    >
      <header>
        <h1
          className="text-[1.1rem] font-bold leading-tight tracking-tight text-neutral-950"
          style={{ color: t.accentStrong }}
        >
          {name ? name : <PlaceholderName>Your name</PlaceholderName>}
        </h1>
        {doc.identity.headline ? (
          <p
            className="mt-0.5 text-[11px] font-medium"
            style={{ color: t.accent }}
          >
            {doc.identity.headline}
          </p>
        ) : (
          <p className="mt-0.5 text-[11px] text-neutral-400">Professional headline</p>
        )}
        <ContactInline
          lines={doc.contact.lines}
          className="mt-1 text-[9.5px] leading-snug text-neutral-700"
          accent={t.accent}
        />
        <div
          aria-hidden
          className="mt-2 h-px w-full"
          style={{ backgroundColor: t.accent, opacity: 0.45 }}
        />
      </header>

      <div className="mt-2.5 space-y-2.5">
        {doc.summary ? (
          <section className="space-y-1">
            <ResumeSectionTitle variant="rule" className="text-[0.58rem]" accent={t.accent}>
              Summary
            </ResumeSectionTitle>
            <p className="whitespace-pre-wrap text-neutral-800">{doc.summary}</p>
          </section>
        ) : null}

        {doc.experience.some((e) => e.title || e.company || e.highlights.length) ? (
          <section className="space-y-2">
            <ResumeSectionTitle variant="rule" className="text-[0.58rem]" accent={t.accent}>
              Experience
            </ResumeSectionTitle>
            <ul className="space-y-2">
              {doc.experience.map((ex) => (
                <li key={ex.id}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                    <span className="font-semibold text-neutral-950">
                      {ex.title || "Role"}
                      {ex.company ? ` — ${ex.company}` : ""}
                    </span>
                    {ex.dateRange ? (
                      <span className="text-[9px] text-neutral-600 tabular-nums">
                        {ex.dateRange}
                      </span>
                    ) : null}
                  </div>
                  {ex.location ? (
                    <p className="text-[9px] italic text-neutral-500">{ex.location}</p>
                  ) : null}
                  {ex.highlights.length > 0 ? (
                    <ul
                      className="mt-1 list-outside list-disc space-y-0.5 pl-3.5"
                      style={{ ["--accent-marker" as string]: t.accent }}
                    >
                      {ex.highlights.map((h, i) => (
                        <li key={i} className="marker:text-[var(--accent-marker)]">
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
          <section className="space-y-1">
            <ResumeSectionTitle variant="rule" className="text-[0.58rem]" accent={t.accent}>
              Education
            </ResumeSectionTitle>
            <ul className="space-y-1">
              {doc.education.map((ed) => (
                <li key={ed.id} className="flex flex-wrap justify-between gap-2">
                  <span>
                    <span className="font-semibold">{ed.degreeLine}</span>
                    {ed.school ? ` — ${ed.school}` : ""}
                  </span>
                  {ed.dateRange ? (
                    <span className="text-[9px] text-neutral-600 tabular-nums">{ed.dateRange}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {doc.skills.length > 0 ? (
          <section className="space-y-1">
            <ResumeSectionTitle variant="rule" className="text-[0.58rem]" accent={t.accent}>
              Skills
            </ResumeSectionTitle>
            <p className="text-neutral-800">{doc.skills.join(" · ")}</p>
          </section>
        ) : null}

        {doc.certifications.some((c) => c.name || c.issuer) ? (
          <section className="space-y-1">
            <ResumeSectionTitle variant="rule" className="text-[0.58rem]" accent={t.accent}>
              Certifications
            </ResumeSectionTitle>
            <ul className="space-y-0.5">
              {doc.certifications.map((c) => (
                <li key={c.id} className="flex flex-wrap justify-between gap-2">
                  <span>
                    {c.name}
                    {c.issuer ? ` — ${c.issuer}` : ""}
                  </span>
                  {c.dateLine ? (
                    <span className="text-[9px] text-neutral-600 tabular-nums">{c.dateLine}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {doc.projects.some((p) => p.name || p.description) ? (
          <section className="space-y-1">
            <ResumeSectionTitle variant="rule" className="text-[0.58rem]" accent={t.accent}>
              Projects
            </ResumeSectionTitle>
            <ul className="space-y-1.5">
              {doc.projects.map((p) => (
                <li key={p.id}>
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="font-semibold">{p.name || "Project"}</span>
                    {p.url ? (
                      <a
                        href={p.url.startsWith("http") ? p.url : `https://${p.url}`}
                        className="text-[9px] underline-offset-2 hover:underline"
                        style={{ color: t.accent }}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        {p.url}
                      </a>
                    ) : null}
                  </div>
                  {p.description ? <p>{p.description}</p> : null}
                  {p.technologies ? (
                    <p className="text-[9px] italic text-neutral-500">
                      Stack: {p.technologies}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {doc.additional ? (
          <section className="space-y-1">
            <ResumeSectionTitle variant="rule" className="text-[0.58rem]" accent={t.accent}>
              Additional
            </ResumeSectionTitle>
            <p className="whitespace-pre-wrap text-neutral-800">{doc.additional}</p>
          </section>
        ) : null}
      </div>
    </article>
  );
}

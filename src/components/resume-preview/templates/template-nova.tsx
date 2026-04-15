import type { ResumePreviewDocument } from "@/lib/resume-preview/model";
import {
  ContactInline,
  PlaceholderName,
  ResumeSectionTitle,
} from "@/components/resume-preview/shared-parts";
import { cn } from "@/lib/utils";

type Props = {
  doc: ResumePreviewDocument;
  className?: string;
};

/**
 * Nova — compact density for long histories; linear flow preserved for parsers.
 */
export function TemplateNova({ doc, className }: Props) {
  const name = doc.identity.fullName || null;

  return (
    <article
      className={cn(
        "resume-paper box-border min-h-[min(260mm,75vh)] w-full max-w-[210mm] bg-white p-[clamp(8mm,2.2vw,10mm)] text-neutral-900 print:min-h-0 print:w-[210mm]",
        className,
      )}
      data-template="nova"
    >
      <header className="border-b border-neutral-300 pb-2">
        <h1 className="text-lg font-bold leading-tight tracking-tight text-neutral-950">
          {name ? name : <PlaceholderName>Your name</PlaceholderName>}
        </h1>
        {doc.identity.headline ? (
          <p className="mt-0.5 text-[11px] font-medium text-neutral-800">{doc.identity.headline}</p>
        ) : (
          <p className="mt-0.5 text-[11px] text-neutral-400">Professional headline</p>
        )}
        <div className="mt-1.5 text-[9.5px] leading-snug text-neutral-700">
          <ContactInline lines={doc.contact.lines} />
        </div>
      </header>

      <div className="mt-3 space-y-3 text-[9.75px] leading-snug text-neutral-800">
        {doc.summary ? (
          <section className="space-y-1">
            <ResumeSectionTitle className="pb-0.5 text-[0.58rem]">Summary</ResumeSectionTitle>
            <p className="whitespace-pre-wrap">{doc.summary}</p>
          </section>
        ) : null}

        {doc.experience.some((e) => e.title || e.company || e.highlights.length) ? (
          <section className="space-y-2">
            <ResumeSectionTitle className="pb-0.5 text-[0.58rem]">Experience</ResumeSectionTitle>
            <ul className="space-y-2.5">
              {doc.experience.map((ex) => (
                <li key={ex.id}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                    <span className="font-semibold text-neutral-950">
                      {ex.title || "Role"}
                      {ex.company ? ` — ${ex.company}` : ""}
                    </span>
                    {ex.dateRange ? (
                      <span className="text-[9px] text-neutral-600 tabular-nums">{ex.dateRange}</span>
                    ) : null}
                  </div>
                  {ex.location ? (
                    <p className="text-[9px] text-neutral-600">{ex.location}</p>
                  ) : null}
                  {ex.highlights.length > 0 ? (
                    <ul className="mt-1 list-outside list-disc space-y-0.5 pl-3.5 marker:text-neutral-400">
                      {ex.highlights.map((h, i) => (
                        <li key={i}>{h}</li>
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
            <ResumeSectionTitle className="pb-0.5 text-[0.58rem]">Education</ResumeSectionTitle>
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
            <ResumeSectionTitle className="pb-0.5 text-[0.58rem]">Skills</ResumeSectionTitle>
            <p>{doc.skills.join(" · ")}</p>
          </section>
        ) : null}

        {doc.certifications.some((c) => c.name || c.issuer) ? (
          <section className="space-y-1">
            <ResumeSectionTitle className="pb-0.5 text-[0.58rem]">Certifications</ResumeSectionTitle>
            <ul className="space-y-0.5">
              {doc.certifications.map((c) => (
                <li key={c.id}>
                  {c.name}
                  {c.issuer ? ` — ${c.issuer}` : ""}
                  {c.dateLine ? ` · ${c.dateLine}` : ""}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {doc.projects.some((p) => p.name || p.description) ? (
          <section className="space-y-1">
            <ResumeSectionTitle className="pb-0.5 text-[0.58rem]">Projects</ResumeSectionTitle>
            <ul className="space-y-1">
              {doc.projects.map((p) => (
                <li key={p.id}>
                  <span className="font-semibold">{p.name || "Project"}</span>
                  {p.description ? <span> — {p.description}</span> : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {doc.additional ? (
          <section className="space-y-1">
            <ResumeSectionTitle className="pb-0.5 text-[0.58rem]">Additional</ResumeSectionTitle>
            <p className="whitespace-pre-wrap">{doc.additional}</p>
          </section>
        ) : null}
      </div>
    </article>
  );
}

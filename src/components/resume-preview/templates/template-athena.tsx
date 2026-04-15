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
 * Athena — single column, ATS-safe hierarchy, generous whitespace.
 */
export function TemplateAthena({ doc, className }: Props) {
  const name = doc.identity.fullName || null;
  const headline = doc.identity.headline;

  return (
    <article
      className={cn(
        "resume-paper box-border min-h-[min(280mm,80vh)] w-full max-w-[210mm] bg-white p-[clamp(10mm,3vw,14mm)] text-neutral-900 shadow-none print:min-h-0 print:w-[210mm] print:shadow-none",
        className,
      )}
      data-template="athena"
    >
      <header className="border-b border-neutral-200 pb-4 text-center print:border-neutral-300">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-950">
          {name ? name : <PlaceholderName>Your name</PlaceholderName>}
        </h1>
        {headline ? (
          <p className="mt-2 text-sm font-medium text-neutral-700">{headline}</p>
        ) : (
          <p className="mt-2 text-sm text-neutral-400">Professional headline</p>
        )}
        <div className="mt-3 text-center text-[11px] leading-relaxed text-neutral-600">
          <ContactInline lines={doc.contact.lines} className="inline-block text-center" />
        </div>
      </header>

      <div className="mt-5 space-y-5 text-[11px] leading-relaxed text-neutral-800">
        {doc.summary ? (
          <section className="space-y-2">
            <ResumeSectionTitle>Summary</ResumeSectionTitle>
            <p className="whitespace-pre-wrap text-neutral-800">{doc.summary}</p>
          </section>
        ) : null}

        {doc.experience.some((e) => e.title || e.company || e.highlights.length) ? (
          <section className="space-y-3">
            <ResumeSectionTitle>Experience</ResumeSectionTitle>
            <ul className="space-y-4">
              {doc.experience.map((ex) => (
                <li key={ex.id}>
                  <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between">
                    <div>
                      <span className="font-semibold text-neutral-900">{ex.title || "Role"}</span>
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
                    <ul className="mt-2 list-outside list-disc space-y-1 pl-4 marker:text-neutral-400">
                      {ex.highlights.map((h, i) => (
                        <li key={i} className="pl-0.5">
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
          <section className="space-y-2">
            <ResumeSectionTitle>Education</ResumeSectionTitle>
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

        {doc.skills.length > 0 ? (
          <section className="space-y-2">
            <ResumeSectionTitle>Skills</ResumeSectionTitle>
            <p className="text-neutral-800">{doc.skills.join(" · ")}</p>
          </section>
        ) : null}

        {doc.certifications.some((c) => c.name || c.issuer) ? (
          <section className="space-y-2">
            <ResumeSectionTitle>Certifications</ResumeSectionTitle>
            <ul className="space-y-1">
              {doc.certifications.map((c) => (
                <li key={c.id}>
                  <span className="font-medium">{c.name || "Certification"}</span>
                  {c.issuer ? <span className="text-neutral-700"> — {c.issuer}</span> : null}
                  {c.dateLine ? (
                    <span className="text-neutral-600"> · {c.dateLine}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {doc.projects.some((p) => p.name || p.description) ? (
          <section className="space-y-2">
            <ResumeSectionTitle>Projects</ResumeSectionTitle>
            <ul className="space-y-2">
              {doc.projects.map((p) => (
                <li key={p.id}>
                  <span className="font-semibold">{p.name || "Project"}</span>
                  {p.url ? (
                    <span className="text-neutral-600"> · {p.url}</span>
                  ) : null}
                  {p.description ? (
                    <p className="mt-1 text-neutral-800">{p.description}</p>
                  ) : null}
                  {p.technologies ? (
                    <p className="mt-0.5 text-[10px] text-neutral-600">{p.technologies}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {doc.additional ? (
          <section className="space-y-2">
            <ResumeSectionTitle>Additional</ResumeSectionTitle>
            <p className="whitespace-pre-wrap">{doc.additional}</p>
          </section>
        ) : null}
      </div>
    </article>
  );
}

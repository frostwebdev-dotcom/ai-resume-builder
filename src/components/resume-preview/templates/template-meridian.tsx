import type { ResumePreviewDocument } from "@/lib/resume-preview/model";
import {
  ContactStack,
  PlaceholderName,
  ResumeSectionTitle,
} from "@/components/resume-preview/shared-parts";
import { cn } from "@/lib/utils";

type Props = {
  doc: ResumePreviewDocument;
  className?: string;
};

/**
 * Meridian — structured header grid, subtle band for summary, still ATS-linear in reading order.
 */
export function TemplateMeridian({ doc, className }: Props) {
  const name = doc.identity.fullName || null;

  return (
    <article
      className={cn(
        "resume-paper box-border min-h-[min(280mm,80vh)] w-full max-w-[210mm] bg-white p-[clamp(9mm,2.5vw,12mm)] text-neutral-900 print:min-h-0 print:w-[210mm]",
        className,
      )}
      data-template="meridian"
    >
      <header className="grid gap-4 border-b border-neutral-800/10 pb-4 sm:grid-cols-[1fr_auto] sm:items-start sm:gap-8 print:border-neutral-300">
        <div>
          <h1 className="text-[1.35rem] font-bold tracking-tight text-neutral-950">
            {name ? name : <PlaceholderName>Your name</PlaceholderName>}
          </h1>
          {doc.identity.headline ? (
            <p className="mt-1.5 text-[13px] font-medium leading-snug text-neutral-700">
              {doc.identity.headline}
            </p>
          ) : (
            <p className="mt-1.5 text-[13px] text-neutral-400">Professional headline</p>
          )}
        </div>
        <div className="text-[10.5px] leading-relaxed sm:text-right sm:text-[11px]">
          <ContactStack lines={doc.contact.lines} className="sm:ml-auto sm:max-w-[14rem]" />
        </div>
      </header>

      {doc.summary ? (
        <section className="mt-4 rounded-md bg-neutral-50 px-4 py-3 text-[11px] leading-relaxed text-neutral-800 ring-1 ring-neutral-200/80 print:bg-transparent print:px-0 print:py-2 print:ring-0">
          <p className="whitespace-pre-wrap">{doc.summary}</p>
        </section>
      ) : null}

      <div className="mt-5 space-y-5 text-[11px] leading-relaxed text-neutral-800">
        {doc.experience.some((e) => e.title || e.company || e.highlights.length) ? (
          <section className="space-y-3">
            <ResumeSectionTitle className="border-neutral-800/20 text-neutral-800">
              Experience
            </ResumeSectionTitle>
            <ul className="space-y-4">
              {doc.experience.map((ex) => (
                <li key={ex.id} className="border-l-2 border-neutral-200 pl-3 print:border-neutral-300">
                  <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                    <div>
                      <span className="font-semibold text-neutral-950">{ex.title || "Role"}</span>
                      {ex.company ? (
                        <span className="font-medium text-neutral-800"> · {ex.company}</span>
                      ) : null}
                    </div>
                    {ex.dateRange ? (
                      <span className="text-[10px] text-neutral-600 tabular-nums">{ex.dateRange}</span>
                    ) : null}
                  </div>
                  {ex.location ? (
                    <p className="text-[10px] text-neutral-600">{ex.location}</p>
                  ) : null}
                  {ex.highlights.length > 0 ? (
                    <ul className="mt-2 list-outside list-disc space-y-1 pl-4 text-neutral-800">
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
          <section className="space-y-2">
            <ResumeSectionTitle className="border-neutral-800/20 text-neutral-800">
              Education
            </ResumeSectionTitle>
            <ul className="space-y-2">
              {doc.education.map((ed) => (
                <li key={ed.id} className="flex flex-col gap-0.5 sm:flex-row sm:justify-between">
                  <div>
                    <span className="font-semibold">{ed.degreeLine}</span>
                    {ed.school ? <span> — {ed.school}</span> : null}
                  </div>
                  {ed.dateRange ? (
                    <span className="text-[10px] text-neutral-600 tabular-nums">{ed.dateRange}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="grid gap-5 sm:grid-cols-2 sm:gap-6">
          {doc.skills.length > 0 ? (
            <section className="space-y-2">
              <ResumeSectionTitle className="border-neutral-800/20 text-neutral-800">
                Skills
              </ResumeSectionTitle>
              <p className="text-[10.5px] leading-snug text-neutral-800">{doc.skills.join(" · ")}</p>
            </section>
          ) : null}

          {doc.certifications.some((c) => c.name || c.issuer) ? (
            <section className="space-y-2">
              <ResumeSectionTitle className="border-neutral-800/20 text-neutral-800">
                Certifications
              </ResumeSectionTitle>
              <ul className="space-y-1 text-[10.5px]">
                {doc.certifications.map((c) => (
                  <li key={c.id}>
                    <span className="font-medium">{c.name}</span>
                    {c.issuer ? ` — ${c.issuer}` : ""}
                    {c.dateLine ? ` · ${c.dateLine}` : ""}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        {doc.projects.some((p) => p.name || p.description) ? (
          <section className="space-y-2">
            <ResumeSectionTitle className="border-neutral-800/20 text-neutral-800">
              Projects
            </ResumeSectionTitle>
            <ul className="space-y-2">
              {doc.projects.map((p) => (
                <li key={p.id}>
                  <span className="font-semibold">{p.name || "Project"}</span>
                  {p.url ? <span className="text-neutral-600"> · {p.url}</span> : null}
                  {p.description ? <p className="mt-0.5">{p.description}</p> : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {doc.additional ? (
          <section className="space-y-2">
            <ResumeSectionTitle className="border-neutral-800/20 text-neutral-800">
              Additional
            </ResumeSectionTitle>
            <p className="whitespace-pre-wrap">{doc.additional}</p>
          </section>
        ) : null}
      </div>
    </article>
  );
}

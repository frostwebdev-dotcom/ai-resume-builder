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
 * Athena — centered executive layout. Generous whitespace, strong
 * typographic hierarchy, strictly single-column for ATS safety.
 */
export function TemplateAthena({ doc, className }: Props) {
  const t = getTemplateTheme("athena");
  const name = doc.identity.fullName || null;
  const headline = doc.identity.headline;

  return (
    <article
      className={cn(
        "resume-paper box-border min-h-[min(280mm,80vh)] w-full max-w-[210mm] bg-white p-[clamp(10mm,3vw,14mm)] text-[11px] leading-relaxed text-neutral-900 print:min-h-0 print:w-[210mm] print:shadow-none",
        className,
      )}
      data-template="athena"
    >
      <header className="text-center">
        <h1
          className="text-[1.55rem] font-bold tracking-[0.01em] text-neutral-950"
          style={{ color: t.accentStrong }}
        >
          {name ? name : <PlaceholderName>Your name</PlaceholderName>}
        </h1>
        {headline ? (
          <p
            className="mt-2 text-[0.8rem] font-medium tracking-wide"
            style={{ color: t.accent }}
          >
            {headline}
          </p>
        ) : (
          <p className="mt-2 text-[0.8rem] text-neutral-400">Professional headline</p>
        )}
        <ContactInline
          lines={doc.contact.lines}
          className="mt-2 text-[10.5px] leading-snug text-neutral-600"
          accent={t.accent}
        />
        <div className="mx-auto mt-3 h-[1.25px] w-1/3" style={{ backgroundColor: t.accent }} />
      </header>

      <div className="mt-5 space-y-5">
        {doc.summary ? (
          <section className="space-y-2">
            <ResumeSectionTitle variant="underline" accent={t.accentStrong}>
              Summary
            </ResumeSectionTitle>
            <p className="whitespace-pre-wrap text-neutral-800">{doc.summary}</p>
          </section>
        ) : null}

        {doc.experience.some((e) => e.title || e.company || e.highlights.length) ? (
          <section className="space-y-3">
            <ResumeSectionTitle variant="underline" accent={t.accentStrong}>
              Experience
            </ResumeSectionTitle>
            <ul className="space-y-4">
              {doc.experience.map((ex) => (
                <li key={ex.id}>
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
                      style={{ color: "inherit" }}
                    >
                      {ex.highlights.map((h, i) => (
                        <li
                          key={i}
                          className="pl-0.5 marker:text-[var(--accent-marker)]"
                          style={{ ["--accent-marker" as string]: t.accent }}
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
          <section className="space-y-2">
            <ResumeSectionTitle variant="underline" accent={t.accentStrong}>
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
                  {ed.details ? <p className="mt-1 text-neutral-700">{ed.details}</p> : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {doc.skills.length > 0 ? (
          <section className="space-y-2">
            <ResumeSectionTitle variant="underline" accent={t.accentStrong}>
              Skills
            </ResumeSectionTitle>
            <p className="text-neutral-800">{doc.skills.join(" · ")}</p>
          </section>
        ) : null}

        {doc.certifications.some((c) => c.name || c.issuer) ? (
          <section className="space-y-2">
            <ResumeSectionTitle variant="underline" accent={t.accentStrong}>
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
                    <span className="text-[10px] text-neutral-600 tabular-nums">{c.dateLine}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {doc.projects.some((p) => p.name || p.description) ? (
          <section className="space-y-2">
            <ResumeSectionTitle variant="underline" accent={t.accentStrong}>
              Projects
            </ResumeSectionTitle>
            <ul className="space-y-2.5">
              {doc.projects.map((p) => (
                <li key={p.id}>
                  <span className="font-semibold">{p.name || "Project"}</span>
                  {p.url ? (
                    <a
                      href={p.url.startsWith("http") ? p.url : `https://${p.url}`}
                      className="ml-1.5 underline-offset-2 hover:underline"
                      style={{ color: t.accent }}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {p.url}
                    </a>
                  ) : null}
                  {p.description ? (
                    <p className="mt-1 text-neutral-800">{p.description}</p>
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
          <section className="space-y-2">
            <ResumeSectionTitle variant="underline" accent={t.accentStrong}>
              Additional
            </ResumeSectionTitle>
            <p className="whitespace-pre-wrap">{doc.additional}</p>
          </section>
        ) : null}
      </div>
    </article>
  );
}

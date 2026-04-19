import {
  ContactStack,
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
 * Meridian — structured split header with an accent rule. Confident,
 * modern, still linear for ATS parsers.
 */
export function TemplateMeridian({ doc, className }: Props) {
  const t = getTemplateTheme("meridian");
  const name = doc.identity.fullName || null;

  return (
    <article
      className={cn(
        "resume-paper box-border min-h-[min(280mm,80vh)] w-full max-w-[210mm] bg-white p-[clamp(9mm,2.5vw,12mm)] text-[11px] leading-relaxed text-neutral-900 print:min-h-0 print:w-[210mm]",
        className,
      )}
      data-template="meridian"
    >
      <header className="grid gap-4 pb-3 sm:grid-cols-[1.15fr_0.85fr] sm:items-start sm:gap-8">
        <div className="min-w-0">
          <h1
            className="text-[1.45rem] font-bold leading-tight tracking-tight text-neutral-950"
            style={{ color: t.accentStrong }}
          >
            {name ? name : <PlaceholderName>Your name</PlaceholderName>}
          </h1>
          {doc.identity.headline ? (
            <p
              className="mt-1 text-[13px] font-medium leading-snug"
              style={{ color: t.accent }}
            >
              {doc.identity.headline}
            </p>
          ) : (
            <p className="mt-1 text-[13px] text-neutral-400">Professional headline</p>
          )}
        </div>
        <div className="text-[10.5px] leading-relaxed sm:text-right sm:text-[11px]">
          <ContactStack
            lines={doc.contact.lines}
            className="sm:ml-auto sm:max-w-[15rem]"
            accent={t.accent}
          />
        </div>
      </header>

      <div
        className="flex items-center gap-2"
        aria-hidden
      >
        <span
          className="h-[2.5px] w-11 rounded-full"
          style={{ backgroundColor: t.accent }}
        />
        <span className="h-px flex-1 bg-neutral-200 print:bg-neutral-300" />
      </div>

      {doc.summary ? (
        <section className="mt-4">
          <p className="whitespace-pre-wrap text-neutral-800">{doc.summary}</p>
        </section>
      ) : null}

      <div className="mt-5 space-y-5">
        {doc.experience.some((e) => e.title || e.company || e.highlights.length) ? (
          <section className="space-y-3">
            <ResumeSectionTitle variant="accent-rule" accent={t.accentStrong}>
              Experience
            </ResumeSectionTitle>
            <ul className="space-y-4">
              {doc.experience.map((ex) => (
                <li
                  key={ex.id}
                  className="border-l-2 pl-3"
                  style={{ borderColor: t.accent }}
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                    <div className="min-w-0">
                      <span className="font-semibold text-neutral-950">
                        {ex.title || "Role"}
                      </span>
                      {ex.company ? (
                        <span className="font-medium text-neutral-800"> · {ex.company}</span>
                      ) : null}
                    </div>
                    {ex.dateRange ? (
                      <span className="text-[10px] text-neutral-600 tabular-nums">
                        {ex.dateRange}
                      </span>
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
            <ResumeSectionTitle variant="accent-rule" accent={t.accentStrong}>
              Education
            </ResumeSectionTitle>
            <ul className="space-y-2">
              {doc.education.map((ed) => (
                <li key={ed.id}>
                  <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between">
                    <div>
                      <span className="font-semibold">{ed.degreeLine}</span>
                      {ed.school ? <span> — {ed.school}</span> : null}
                    </div>
                    {ed.dateRange ? (
                      <span className="text-[10px] text-neutral-600 tabular-nums">
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

        <div className="grid gap-5 sm:grid-cols-2 sm:gap-6">
          {doc.skills.length > 0 ? (
            <section className="space-y-2">
              <ResumeSectionTitle variant="accent-rule" accent={t.accentStrong}>
                Skills
              </ResumeSectionTitle>
              <p className="text-[10.5px] leading-snug text-neutral-800">
                {doc.skills.join(" · ")}
              </p>
            </section>
          ) : null}

          {doc.certifications.some((c) => c.name || c.issuer) ? (
            <section className="space-y-2">
              <ResumeSectionTitle variant="accent-rule" accent={t.accentStrong}>
                Certifications
              </ResumeSectionTitle>
              <ul className="space-y-1 text-[10.5px]">
                {doc.certifications.map((c) => (
                  <li key={c.id} className="flex flex-wrap justify-between gap-2">
                    <span>
                      <span className="font-medium">{c.name}</span>
                      {c.issuer ? ` — ${c.issuer}` : ""}
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

        {doc.projects.some((p) => p.name || p.description) ? (
          <section className="space-y-2">
            <ResumeSectionTitle variant="accent-rule" accent={t.accentStrong}>
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
                        style={{ color: t.accent }}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        {p.url}
                      </a>
                    ) : null}
                  </div>
                  {p.description ? <p className="mt-0.5">{p.description}</p> : null}
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
            <ResumeSectionTitle variant="accent-rule" accent={t.accentStrong}>
              Additional
            </ResumeSectionTitle>
            <p className="whitespace-pre-wrap">{doc.additional}</p>
          </section>
        ) : null}
      </div>
    </article>
  );
}

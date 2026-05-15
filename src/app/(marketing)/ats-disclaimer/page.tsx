import type { Metadata } from "next";
import { FileSearch } from "lucide-react";

import { LegalDocLayout } from "@/components/marketing/legal-doc-layout";
import { APP_NAME } from "@/lib/constants";
import { LEGAL_LAST_UPDATED_LABEL } from "@/lib/legal/last-updated";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "ATS Disclaimer",
    description: `How ${APP_NAME} approaches ATS-friendly formatting without guaranteeing employer parser results.`,
    robots: { index: true, follow: true },
  };
}

export default function AtsDisclaimerPage() {
  return (
    <LegalDocLayout
      eyebrowIcon={FileSearch}
      eyebrowLabel="ATS disclaimer"
      title="ATS-friendly formatting — not a guarantee"
      lastUpdated={LEGAL_LAST_UPDATED_LABEL}
      intro={
        <p>
          We describe our templates and export behavior as supporting{" "}
          <span className="font-medium text-foreground">ATS-friendly formatting</span>: readable headings,
          consistent date patterns, and layouts designed to avoid common parsing pitfalls. That wording
          describes our design intent — it is not a promise about any specific employer&apos;s software.
        </p>
      }
      sections={[
        {
          id: "systems-vary",
          title: "Employer systems vary",
          body: (
            <p>
              &ldquo;ATS&rdquo; is not one universal program. Companies use different vendors, versions,
              configurations, and manual workflows. Some systems emphasize keyword matching; others
              emphasize structure; some recruiters review PDFs directly. {APP_NAME} cannot see or control
              those environments, so we cannot guarantee how your file will be scored, displayed, or
              stored after you apply.
            </p>
          ),
        },
        {
          id: "no-guarantee",
          title: "No guaranteed ATS outcome",
          body: (
            <p>
              We do not guarantee that your resume will pass automated screening, rank highly, or be
              extracted without errors. Testing in one tool or preview does not prove identical behavior
              in another. If an employer provides explicit instructions (file type, length limits,
              required sections), follow those instructions even when they differ from our defaults.
            </p>
          ),
        },
        {
          id: "what-we-do",
          title: "What we still aim for",
          body: (
            <p>
              Within those limits, we work to ship templates and exports that behave well with common
              parsers: semantic section labels, predictable ordering, and export settings suited to
              typical online applications. If something looks off in your preview before you pay to
              export, fix it there — that is the best signal you have before you submit to an employer.
            </p>
          ),
        },
      ]}
    />
  );
}

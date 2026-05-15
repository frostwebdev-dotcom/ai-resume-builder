import type { Metadata } from "next";
import { Sparkles } from "lucide-react";

import { LegalDocLayout } from "@/components/marketing/legal-doc-layout";
import { APP_NAME } from "@/lib/constants";
import { LEGAL_LAST_UPDATED_LABEL } from "@/lib/legal/last-updated";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "AI Disclaimer",
    description: `How ${APP_NAME} uses AI and what you should verify before relying on suggestions.`,
    robots: { index: true, follow: true },
  };
}

export default function AiDisclaimerPage() {
  return (
    <LegalDocLayout
      eyebrowIcon={Sparkles}
      eyebrowLabel="AI disclaimer"
      title="Using AI-assisted features responsibly"
      lastUpdated={LEGAL_LAST_UPDATED_LABEL}
      intro={
        <p>
          {APP_NAME} may offer optional AI-assisted suggestions (such as wording or structure ideas).
          These features are meant to save time — they are not a substitute for your own judgment, your
          industry&apos;s standards, or professional advice where that applies.
        </p>
      }
      sections={[
        {
          id: "review",
          title: "Review before you rely on it",
          body: (
            <p>
              AI-generated text can be fluent but wrong: dates, titles, metrics, or claims may be
              invented or misstated. You should read every suggestion carefully, compare it to your real
              experience, and edit anything that is inaccurate, incomplete, or misleading before you share
              your resume with employers.
            </p>
          ),
        },
        {
          id: "not-advice",
          title: "Not professional or legal advice",
          body: (
            <p>
              Nothing produced by the AI features constitutes legal, tax, immigration, licensing, or
              human-resources advice, and we do not create an attorney–client or similar relationship.
              If you need certainty for regulated professions, union rules, government filings, or
              contracts, consult a qualified professional.
            </p>
          ),
        },
        {
          id: "your-responsibility",
          title: "You confirm accuracy",
          body: (
            <p>
              You remain responsible for the final content of your resume and for any consequences of
              submitting it. By using AI features, you acknowledge that suggestions are provided &ldquo;as
              is&rdquo; for drafting assistance and may require substantial revision.
            </p>
          ),
        },
      ]}
    />
  );
}

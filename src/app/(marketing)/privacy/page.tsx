import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { MktSection } from "@/components/marketing/mkt-section";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How AI Resume Builder collects, uses, and protects your information.",
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <MktSection className="pt-10 sm:pt-14">
      <PageContainer>
        <article className="mx-auto max-w-3xl">
          <h1 className="text-display">Privacy Policy</h1>
          <p className="mt-2 text-caption">Last updated: April 15, 2026</p>
          <p className="mt-8 text-sm leading-relaxed text-muted-foreground">
            This policy describes how {`"`}AI Resume Builder{`"`} (“we”, “us”) handles information when
            you use our website and product. It is written for transparency and will evolve as
            features ship — check back for updates.
          </p>

          <section className="mt-10 space-y-4">
            <h2 className="text-subhead text-foreground">Information we collect</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              We collect information you provide directly — such as account details (e.g., email) and
              resume content you enter in the editor. We also collect limited technical data needed to
              operate the service (for example, authentication tokens, basic diagnostics, and security
              logs).
            </p>
          </section>

          <section className="mt-10 space-y-4">
            <h2 className="text-subhead text-foreground">How we use information</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              We use your information to provide the product: saving your projects, generating
              previews and PDFs, processing payments through our payment provider, and communicating
              transactional emails (such as password resets). We may use aggregated or de-identified
              data to understand product usage and improve reliability.
            </p>
          </section>

          <section className="mt-10 space-y-4">
            <h2 className="text-subhead text-foreground">AI features</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              When you request AI assistance, relevant portions of your content may be sent to our AI
              provider to generate suggestions. We configure these requests to support the feature and
              do not sell your resume text to third parties for advertising.
            </p>
          </section>

          <section className="mt-10 space-y-4">
            <h2 className="text-subhead text-foreground">Data retention & deletion</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              We retain account and project data as long as your account is active and as needed to
              comply with law. You may request deletion of your account by contacting us; some
              records may be retained where required for legitimate business or legal reasons (such as
              payment records).
            </p>
          </section>

          <section className="mt-10 space-y-4">
            <h2 className="text-subhead text-foreground">Security</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              We use industry-standard practices and trusted infrastructure providers (including
              Supabase for authentication and database services). No online service can guarantee
              perfect security — please use a strong password and protect your account credentials.
            </p>
          </section>

          <section className="mt-10 space-y-4">
            <h2 className="text-subhead text-foreground">Contact</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Questions about privacy? Reach out via the contact page. Replace placeholder contact
              details with your production support address before launch.
            </p>
          </section>
        </article>
      </PageContainer>
    </MktSection>
  );
}

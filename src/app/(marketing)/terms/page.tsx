import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { MktSection } from "@/components/marketing/mkt-section";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms governing your use of AI Resume Builder.",
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <MktSection className="pt-10 sm:pt-14">
      <PageContainer>
        <article className="mx-auto max-w-3xl">
          <h1 className="text-display">Terms of Service</h1>
          <p className="mt-2 text-caption">Last updated: April 15, 2026</p>
          <p className="mt-8 text-sm leading-relaxed text-muted-foreground">
            These terms govern your access to {`"`}AI Resume Builder{`"`}. By using the service, you
            agree to them. If you do not agree, do not use the product.
          </p>

          <section className="mt-10 space-y-4">
            <h2 className="text-subhead text-foreground">The service</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              We provide tools to draft, preview, and export resumes. Features may change as we ship
              improvements. We strive for high availability but do not guarantee uninterrupted access.
            </p>
          </section>

          <section className="mt-10 space-y-4">
            <h2 className="text-subhead text-foreground">Accounts</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              You are responsible for your account credentials and for the accuracy of information
              you submit. You must not misuse the service (for example, attempting to access others’
              data, attacking infrastructure, or uploading unlawful content).
            </p>
          </section>

          <section className="mt-10 space-y-4">
            <h2 className="text-subhead text-foreground">Payments & exports</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Certain actions (such as PDF export) may require payment. Prices and taxes are presented
              at checkout. Unless stated otherwise, purchases are subject to the refund approach
              described in our FAQ and communications — finalize refund language with counsel before
              launch.
            </p>
          </section>

          <section className="mt-10 space-y-4">
            <h2 className="text-subhead text-foreground">Content</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              You retain rights to your resume content. You grant us the license we need to host,
              process, and display your content to operate the service (including AI-assisted
              features you request).
            </p>
          </section>

          <section className="mt-10 space-y-4">
            <h2 className="text-subhead text-foreground">Disclaimer</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              The service is provided “as is.” We do not guarantee job outcomes, interview requests,
              or compatibility with every employer system. To the maximum extent permitted by law, we
              disclaim warranties not expressly stated here.
            </p>
          </section>

          <section className="mt-10 space-y-4">
            <h2 className="text-subhead text-foreground">Limitation of liability</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              To the maximum extent permitted by law, our total liability for claims arising from the
              service will be limited to the amounts you paid us in the twelve months preceding the
              claim (or, if none, zero). Some jurisdictions do not allow certain limitations — in those
              cases, our liability is limited to the fullest extent allowed.
            </p>
          </section>

          <section className="mt-10 space-y-4">
            <h2 className="text-subhead text-foreground">Changes</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              We may update these terms. Continued use after changes constitutes acceptance. Material
              changes will be communicated in-product or by email where appropriate.
            </p>
          </section>
        </article>
      </PageContainer>
    </MktSection>
  );
}

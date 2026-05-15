import type { Metadata } from "next";
import Link from "next/link";
import { ScrollText } from "lucide-react";

import { LegalDocLayout } from "@/components/marketing/legal-doc-layout";
import { LegalSupportContact } from "@/components/marketing/legal-support-contact";
import { APP_NAME, ROUTES } from "@/lib/constants";
import { LEGAL_LAST_UPDATED_LABEL } from "@/lib/legal/last-updated";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Terms of Service",
    description: `Terms governing your use of ${APP_NAME}.`,
    robots: { index: true, follow: true },
  };
}

export default function TermsPage() {
  return (
    <LegalDocLayout
      eyebrowIcon={ScrollText}
      eyebrowLabel="Terms of service"
      title="The rules for using our product"
      lastUpdated={LEGAL_LAST_UPDATED_LABEL}
      intro={
        <p>
          These terms govern your access to &quot;{APP_NAME}&quot;. By creating an account, paying for an
          export, or otherwise using the service, you agree to them. If you do not agree, please do not
          use the product.
        </p>
      }
      sections={[
        {
          id: "the-service",
          title: "The service",
          body: (
            <p>
              We provide tools to draft, structure, preview, and export resumes. Features, limits, and
              pricing may change as we ship improvements; we will communicate material changes in-product
              or by email where appropriate. We aim for reliable uptime but do not guarantee uninterrupted
              access.
            </p>
          ),
        },
        {
          id: "acceptable-use",
          title: "Acceptable use",
          body: (
            <p>
              You agree not to misuse the service — including attempting to access another person&apos;s
              account or data, probing or attacking our systems, scraping in violation of technical
              limits, uploading malware, generating unlawful or harassing content, or using the product in
              a way that violates applicable law. We may investigate abuse and cooperate with law
              enforcement when required.
            </p>
          ),
        },
        {
          id: "accounts",
          title: "Accounts and termination",
          body: (
            <>
              <p>
                You are responsible for safeguarding your login credentials and for activity that occurs
                under your account (unless caused by our gross negligence or a security failure on our
                side that we failed to remedy promptly after notice).
              </p>
              <p>
                We may suspend or terminate access if we reasonably believe these terms were violated, if
                continued use creates security or legal risk, or if we discontinue the service with
                reasonable notice where feasible. You may stop using the product at any time; some
                provisions that naturally survive (such as limitations of liability for past events)
                continue after termination.
              </p>
            </>
          ),
        },
        {
          id: "accuracy",
          title: "Accuracy of your resume",
          body: (
            <p>
              You are solely responsible for the truthfulness, completeness, and suitability of the
              information in your resume. The product helps you format and phrase content — it does not
              verify employment history, education, licenses, or claims you make to employers. You
              confirm that you have the right to submit the content you upload or generate.
            </p>
          ),
        },
        {
          id: "payments",
          title: "Payments",
          body: (
            <>
              <p>
                Paid features (such as PDF export for a project) are billed through{" "}
                <span className="font-medium text-foreground">Stripe</span> at the prices shown at
                checkout, plus applicable taxes if displayed. You authorize us and our payment processor
                to charge your selected payment method for completed purchases.
              </p>
              <p>
                Digital purchases are generally non-refundable except where required by law or as
                described in our{" "}
                <Link
                  href={ROUTES.refundPolicy}
                  className="font-medium text-brand underline-offset-4 hover:underline"
                >
                  Refund policy
                </Link>
                . For billing questions, contact us using <LegalSupportContact />.
              </p>
            </>
          ),
        },
        {
          id: "no-job-guarantee",
          title: "No interview or job guarantee",
          body: (
            <>
              <p>
                {APP_NAME} is a document and formatting tool. We do not guarantee interviews, callbacks,
                offers, or any particular outcome with employers. Hiring decisions depend on many factors
                outside our control.
              </p>
              <p>
                For expectations around employer parsing systems, see our{" "}
                <Link
                  href={ROUTES.atsDisclaimer}
                  className="font-medium text-brand underline-offset-4 hover:underline"
                >
                  ATS disclaimer
                </Link>
                .
              </p>
            </>
          ),
        },
        {
          id: "content-ip",
          title: "Your content and license to us",
          body: (
            <p>
              You retain ownership of your original resume content. To operate the service, you grant
              us a non-exclusive license to host, store, reproduce, adapt (for example, reformatting for
              preview or PDF export), display, and process your content — including sending portions to
              subprocessors you interact with (such as Stripe for checkout or an AI provider when you
              request AI features) — solely to provide and improve the product on your behalf.
            </p>
          ),
        },
        {
          id: "disclaimer-liability",
          title: "Disclaimer and limitation of liability",
          body: (
            <>
              <p>
                The service is provided &ldquo;as is&rdquo; and &ldquo;as available.&rdquo; To the maximum
                extent permitted by law, we disclaim implied warranties such as merchantability or
                fitness for a particular purpose except where such disclaimers are not allowed.
              </p>
              <p>
                To the maximum extent permitted by law, our total liability for claims arising out of or
                relating to the service will not exceed the amounts you paid us for the service in the
                twelve (12) months before the event giving rise to the claim (or, if greater, the amount
                paid for the specific export or feature directly at issue). Some jurisdictions do not
                allow certain limitations; in those cases, our liability is limited to the fullest extent
                permitted.
              </p>
            </>
          ),
        },
        {
          id: "changes",
          title: "Changes to these terms",
          body: (
            <p>
              We may update these terms from time to time. If we make material changes, we will take
              reasonable steps to notify you (for example, by email or an in-app notice). Continued use
              after the effective date constitutes acceptance of the revised terms.
            </p>
          ),
        },
      ]}
    />
  );
}

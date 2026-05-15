import type { Metadata } from "next";
import Link from "next/link";
import { Banknote } from "lucide-react";

import { LegalDocLayout } from "@/components/marketing/legal-doc-layout";
import { LegalSupportContact } from "@/components/marketing/legal-support-contact";
import { APP_NAME, ROUTES } from "@/lib/constants";
import { LEGAL_LAST_UPDATED_LABEL } from "@/lib/legal/last-updated";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Refund Policy",
    description: `How refunds work for ${APP_NAME} digital purchases.`,
    robots: { index: true, follow: true },
  };
}

export default function RefundPolicyPage() {
  return (
    <LegalDocLayout
      eyebrowIcon={Banknote}
      eyebrowLabel="Refund policy"
      title="Refunds for digital purchases"
      lastUpdated={LEGAL_LAST_UPDATED_LABEL}
      intro={
        <p>
          {APP_NAME} sells access to digital functionality (for example, unlocking PDF export for a resume
          project). Because delivery is immediate and the product is intangible, completed purchases are
          generally final — this page explains the narrow cases where we may issue a refund or credit.
        </p>
      }
      sections={[
        {
          id: "nature",
          title: "Nature of the product",
          body: (
            <p>
              When checkout completes successfully, your account receives the paid capability right away
              (such as the ability to generate and download an export for the project you paid for). You
              can verify delivery in the product before requesting help. That immediacy is why we treat
              most completed charges as non-refundable unless an exception below applies.
            </p>
          ),
        },
        {
          id: "when-we-consider",
          title: "When we may consider a refund",
          body: (
            <>
              <p>We may offer a refund or account credit where, in our reasonable judgment:</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  You were charged more than once for the same unlock due to a processing error on our
                  side, or
                </li>
                <li>
                  Payment succeeded but the paid feature did not unlock due to a confirmed defect, and we
                  cannot restore access within a reasonable time after you report it, or
                </li>
                <li>
                  A refund is required by the consumer protection laws that apply to your purchase.
                </li>
              </ul>
              <p className="pt-1">
                We do not refund simply because a resume did not result in a job offer, because an
                employer&apos;s system parsed your file differently than expected, or because you changed
                your mind after successfully downloading an export — see also our{" "}
                <Link
                  href={ROUTES.terms}
                  className="font-medium text-brand underline-offset-4 hover:underline"
                >
                  Terms of service
                </Link>{" "}
                and{" "}
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
          id: "how-to-request",
          title: "How to request help",
          body: (
            <p>
              Send a message through <LegalSupportContact />. Include the email on your {APP_NAME}{" "}
              account, the approximate date and amount of the charge, and (if you have it) the Stripe
              receipt or payment descriptor. We use that information to locate the transaction and respond
              quickly.
            </p>
          ),
        },
      ]}
    />
  );
}

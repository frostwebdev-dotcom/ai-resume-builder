import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { LegalDocLayout } from "@/components/marketing/legal-doc-layout";
import { LegalSupportContact } from "@/components/marketing/legal-support-contact";
import { APP_NAME, ROUTES } from "@/lib/constants";
import { LEGAL_LAST_UPDATED_LABEL } from "@/lib/legal/last-updated";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Privacy Policy",
    description: `How ${APP_NAME} collects, uses, and protects your information.`,
    robots: { index: true, follow: true },
  };
}

export default function PrivacyPage() {
  return (
    <LegalDocLayout
      eyebrowIcon={ShieldCheck}
      eyebrowLabel="Privacy policy"
      title="How we handle your data"
      lastUpdated={LEGAL_LAST_UPDATED_LABEL}
      intro={
        <p>
          This policy describes how &quot;{APP_NAME}&quot; (&ldquo;we&rdquo;, &ldquo;us&rdquo;) handles
          information when you use our website and product. It is meant to be clear and practical; we
          may update it as features change — the date at the top reflects the latest revision.
        </p>
      }
      sections={[
        {
          id: "what-we-collect",
          title: "What we collect",
          body: (
            <>
              <p>
                <span className="font-medium text-foreground">Account data.</span> When you sign up or
                sign in, we process identifiers needed to operate your account — for example, your email
                address, authentication events, and basic profile fields you choose to provide.
              </p>
              <p>
                <span className="font-medium text-foreground">Resume and project data.</span> Content you
                enter in the resume editor (text, structured fields, section choices, previews, and
                related metadata) is stored so we can provide editing, autosave, export, and support when
                you ask for help tied to a specific project.
              </p>
              <p>
                <span className="font-medium text-foreground">Technical and security data.</span> Like
                most web apps, we receive limited technical information from your browser and our
                infrastructure partners (for example, request logs and diagnostics) to keep the service
                reliable, secure, and abuse-resistant.
              </p>
            </>
          ),
        },
        {
          id: "payments",
          title: "Payments",
          body: (
            <>
              <p>
                Purchases (such as PDF export unlocks) are processed by{" "}
                <span className="font-medium text-foreground">Stripe</span>. Stripe collects payment
                details on their checkout flows. We do not receive or store your full card number on our
                servers; we may receive limited billing metadata needed to confirm your purchase and
                provide support (for example, payment status, amount, currency, and identifiers that link
                your order to your account).
              </p>
              <p>
                Stripe&apos;s handling of payment information is described in{" "}
                <a
                  href="https://stripe.com/privacy"
                  className="font-medium text-brand underline-offset-4 hover:underline"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Stripe&apos;s privacy policy
                </a>
                .
              </p>
            </>
          ),
        },
        {
          id: "ai-processing",
          title: "AI-assisted features",
          body: (
            <>
              <p>
                When you choose AI-assisted actions inside the product, portions of your resume or related
                prompts may be sent to our AI provider to generate suggestions. You control when those
                features run; we use the output to display suggestions and improve the specific workflow
                you invoked.
              </p>
              <p>
                AI output can be imperfect — please review it carefully. A fuller explanation lives in
                our{" "}
                <Link
                  href={ROUTES.aiDisclaimer}
                  className="font-medium text-brand underline-offset-4 hover:underline"
                >
                  AI disclaimer
                </Link>
                .
              </p>
            </>
          ),
        },
        {
          id: "how-we-use",
          title: "How we use information",
          body: (
            <p>
              We use the categories above to provide and secure the service: host your projects, render
              previews and PDFs, authenticate you, process payments through Stripe, send transactional
              emails (such as purchase receipts or account notices when enabled), troubleshoot issues you
              report, and understand aggregated product usage. We do not sell your resume text to data
              brokers or use it for third-party advertising.
            </p>
          ),
        },
        {
          id: "retention-deletion",
          title: "Retention and deletion",
          body: (
            <>
              <p>
                We keep account and project data while your account is active and for a reasonable period
                afterward where needed for backups, fraud prevention, accounting, or legal compliance.
                Records tied to payments may be retained longer where required to meet tax, accounting, or
                regulatory obligations.
              </p>
              <p>
                <span className="font-medium text-foreground">Deletion requests.</span> To request
                deletion of personal data associated with your account, contact us using the options
                below. We will verify ownership where needed and respond within a reasonable timeframe.
                Some information may be retained in de-identified or aggregated form, or where we must
                keep limited records by law.
              </p>
            </>
          ),
        },
        {
          id: "security",
          title: "Security",
          body: (
            <p>
              We rely on reputable infrastructure providers (including Supabase for authentication and
              database services) and follow common security practices for a web application. No online
              service can promise perfect security — use a strong password, keep your email account secure,
              and let us know promptly if you suspect unauthorized access.
            </p>
          ),
        },
        {
          id: "contact-rights",
          title: "Contact and privacy requests",
          body: (
            <>
              <p>
                Questions about this policy, access requests, or deletion may be sent through{" "}
                <LegalSupportContact />.
              </p>
              <p className="text-muted-foreground/90">
                If you are in a region that provides specific privacy rights, you may have additional
                choices depending on applicable law. We will honor verified requests to the extent we can
                identify your account and the request is consistent with our legal obligations.
              </p>
            </>
          ),
        },
      ]}
    />
  );
}

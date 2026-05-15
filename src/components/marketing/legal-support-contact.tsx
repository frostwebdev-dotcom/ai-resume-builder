import Link from "next/link";

import { ROUTES } from "@/lib/constants";
import { clientEnv } from "@/lib/env";
import { cn } from "@/lib/utils";

type LegalSupportContactProps = {
  className?: string;
};

/**
 * Renders the configured public support email (when set) plus the contact page,
 * without inventing a fake inbox address.
 */
export function LegalSupportContact({ className }: LegalSupportContactProps) {
  const email = clientEnv.NEXT_PUBLIC_CONTACT_EMAIL?.trim();

  return (
    <span className={cn(className)}>
      {email ? (
        <>
          <a
            href={`mailto:${email}`}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            {email}
          </a>
          {" "}
          or our{" "}
          <Link
            href={ROUTES.contact}
            className="font-medium text-brand underline-offset-4 hover:underline"
          >
            contact form
          </Link>
        </>
      ) : (
        <>
          our{" "}
          <Link
            href={ROUTES.contact}
            className="font-medium text-brand underline-offset-4 hover:underline"
          >
            contact form
          </Link>
          . To show a public support address here, set{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.7rem] text-foreground/90">
            NEXT_PUBLIC_CONTACT_EMAIL
          </code>{" "}
          in your deployment environment.
        </>
      )}
    </span>
  );
}

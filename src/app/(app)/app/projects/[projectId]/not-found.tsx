import Link from "next/link";

import { PageContainer } from "@/components/layout/page-container";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";

export default function ProjectNotFound() {
  return (
    <section className="py-16 sm:py-24">
      <PageContainer>
        <div className="mx-auto max-w-md text-center">
          <h1 className="text-headline text-foreground">Resume not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            It may have been deleted, or this link is incorrect.
          </p>
          <Link href={ROUTES.app.root} className={buttonVariants({ className: "mt-8" })}>
            Back to dashboard
          </Link>
        </div>
      </PageContainer>
    </section>
  );
}

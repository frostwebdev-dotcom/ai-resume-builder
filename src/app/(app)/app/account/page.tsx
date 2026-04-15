import { PageContainer } from "@/components/layout/page-container";
import { SectionHeader } from "@/components/ui/section-header";
import { requireUser } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const { user, profile } = await requireUser();

  const memberSince = new Intl.DateTimeFormat(undefined, {
    dateStyle: "long",
  }).format(new Date(profile.created_at));

  return (
    <section className="py-8 sm:py-10">
      <PageContainer>
        <SectionHeader
          level="page"
          title="Account"
          description="Your profile and sign-in details. Billing preferences can be added here later."
        />

        <dl className="mt-8 grid max-w-lg gap-6 rounded-xl border border-border/80 bg-card p-5 text-sm ring-1 ring-foreground/5 sm:p-6">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Email
            </dt>
            <dd className="mt-1 break-all text-base font-medium text-foreground">{user.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Display name
            </dt>
            <dd className="mt-1 text-base text-foreground">{profile.display_name?.trim() || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Member since
            </dt>
            <dd className="mt-1 text-base text-foreground">{memberSince}</dd>
          </div>
        </dl>
      </PageContainer>
    </section>
  );
}

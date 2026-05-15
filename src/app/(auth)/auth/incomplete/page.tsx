import Link from "next/link";

import { AuthCard } from "@/components/auth/auth-card";
import { Button, buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/services/auth/actions";

export const metadata = {
  title: "Account setup",
  robots: { index: false, follow: false },
};

export default function AuthIncompletePage() {
  return (
    <AuthCard
      title="We couldn’t load your profile"
      description="You’re signed in, but your account record isn’t available yet. This usually means the database trigger that creates profiles on signup hasn’t been applied, or your project is pointing at the wrong Supabase instance."
    >
      <div className="flex flex-col gap-4 text-sm text-muted-foreground">
        <p>
          Apply the migrations in <code className="rounded bg-muted px-1 py-0.5 text-xs">supabase/migrations</code>{" "}
          to your Supabase project, or sign out and try again after your database is in sync.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <form action={signOutAction}>
            <Button type="submit" variant="default" size="touch">
              Sign out
            </Button>
          </form>
          <Link
            href={ROUTES.home}
            className={cn(
              buttonVariants({ variant: "outline", size: "touch" }),
              "inline-flex justify-center",
            )}
          >
            Back to home
          </Link>
        </div>
      </div>
    </AuthCard>
  );
}

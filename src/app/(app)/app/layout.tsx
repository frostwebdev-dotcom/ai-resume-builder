import { AppAreaShell } from "@/components/layout/app-area-shell";
import { getOptionalAuth } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function AppAreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getOptionalAuth();
  const user = ctx
    ? {
        email: ctx.user.email ?? "",
        isAdmin: ctx.profile.role === "admin",
      }
    : null;

  return <AppAreaShell user={user}>{children}</AppAreaShell>;
}

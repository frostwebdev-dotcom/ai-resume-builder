import { AppShell } from "@/components/layout/app-shell";
import { requireUser } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function AppAreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await requireUser();

  return (
    <AppShell
      user={{
        email: user.email ?? "",
        isAdmin: profile.role === "admin",
      }}
    >
      {children}
    </AppShell>
  );
}

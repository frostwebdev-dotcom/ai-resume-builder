import type { Metadata } from "next";

import { AdminDataTable, AdminTd, AdminTh, AdminTr } from "@/components/admin/admin-data-table";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminSearchBar } from "@/components/admin/admin-search-bar";
import { parsePaginationParams } from "@/lib/admin/search-params";
import { formatAdminDate, shortId } from "@/lib/admin/format";
import { ROUTES } from "@/lib/constants";
import { getAdminUsersList } from "@/services/admin/users";

export const metadata: Metadata = {
  title: "Admin · Users",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const { page, pageSize, q } = parsePaginationParams(sp);
  const { rows, total } = await getAdminUsersList({ page, pageSize, q });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">Users</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Profiles linked to Supabase Auth. Email is loaded from the auth provider for each page.
        </p>
      </div>

      <AdminSearchBar
        actionPath={ROUTES.admin.users}
        defaultQuery={q ?? ""}
        placeholder="Search display name or user id…"
      />

      <AdminDataTable>
        <thead>
          <tr>
            <AdminTh>User</AdminTh>
            <AdminTh>Email</AdminTh>
            <AdminTh>Role</AdminTh>
            <AdminTh>Stripe</AdminTh>
            <AdminTh>Joined</AdminTh>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <AdminTr>
              <AdminTd className="text-muted-foreground" colSpan={5}>
                No users match your filters.
              </AdminTd>
            </AdminTr>
          ) : (
            rows.map(({ profile, email }) => (
              <AdminTr key={profile.id}>
                <AdminTd>
                  <span className="font-medium">{profile.display_name ?? "—"}</span>
                  <br />
                  <span className="font-mono text-xs text-muted-foreground" title={profile.id}>
                    {shortId(profile.id, 12)}
                  </span>
                </AdminTd>
                <AdminTd className="break-all">{email ?? "—"}</AdminTd>
                <AdminTd className="capitalize">{profile.role}</AdminTd>
                <AdminTd className="font-mono text-xs">
                  {profile.stripe_customer_id ? shortId(profile.stripe_customer_id, 14) : "—"}
                </AdminTd>
                <AdminTd className="whitespace-nowrap text-muted-foreground">
                  {formatAdminDate(profile.created_at)}
                </AdminTd>
              </AdminTr>
            ))
          )}
        </tbody>
      </AdminDataTable>

      <AdminPagination
        path={ROUTES.admin.users}
        page={page}
        pageSize={pageSize}
        total={total}
        extra={{ q }}
      />
    </div>
  );
}

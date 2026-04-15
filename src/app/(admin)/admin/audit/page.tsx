import type { Metadata } from "next";

import { AdminDataTable, AdminTd, AdminTh, AdminTr } from "@/components/admin/admin-data-table";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminSearchBar } from "@/components/admin/admin-search-bar";
import { parsePaginationParams } from "@/lib/admin/search-params";
import { formatAdminDate, shortId } from "@/lib/admin/format";
import { ROUTES } from "@/lib/constants";
import { getAdminAuditList } from "@/services/admin/audit";

export const metadata: Metadata = {
  title: "Admin · Audit log",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminAuditPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const { page, pageSize, q } = parsePaginationParams(sp);
  const { rows, total } = await getAdminAuditList({ page, pageSize, q });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">Audit log</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Immutable-style events written by trusted server paths (e.g. billing). Payloads may be truncated in
          the UI.
        </p>
      </div>

      <AdminSearchBar
        actionPath={ROUTES.admin.audit}
        defaultQuery={q ?? ""}
        placeholder="Search action, resource type, actor, or id…"
      />

      <AdminDataTable>
        <thead>
          <tr>
            <AdminTh>When</AdminTh>
            <AdminTh>Action</AdminTh>
            <AdminTh>Resource</AdminTh>
            <AdminTh>Actor</AdminTh>
            <AdminTh>Details</AdminTh>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <AdminTr>
              <AdminTd colSpan={5} className="text-muted-foreground">
                No audit entries match your filters.
              </AdminTd>
            </AdminTr>
          ) : (
            rows.map(({ log, actorDisplayName }) => (
              <AdminTr key={log.id}>
                <AdminTd className="whitespace-nowrap text-muted-foreground">
                  {formatAdminDate(log.created_at)}
                </AdminTd>
                <AdminTd className="font-mono text-xs">{log.action}</AdminTd>
                <AdminTd>
                  <span className="text-xs">{log.resource_type}</span>
                  {log.resource_id ? (
                    <>
                      <br />
                      <span className="font-mono text-xs text-muted-foreground" title={log.resource_id}>
                        {shortId(log.resource_id, 12)}
                      </span>
                    </>
                  ) : null}
                </AdminTd>
                <AdminTd>
                  {actorDisplayName ?? "—"}
                  {log.actor_id ? (
                    <>
                      <br />
                      <span className="font-mono text-xs text-muted-foreground">{shortId(log.actor_id, 10)}</span>
                    </>
                  ) : null}
                </AdminTd>
                <AdminTd className="max-w-[280px] break-words font-mono text-[11px] text-muted-foreground">
                  {log.changes ? JSON.stringify(log.changes).slice(0, 180) : "—"}
                  {log.changes && JSON.stringify(log.changes).length > 180 ? "…" : ""}
                </AdminTd>
              </AdminTr>
            ))
          )}
        </tbody>
      </AdminDataTable>

      <AdminPagination
        path={ROUTES.admin.audit}
        page={page}
        pageSize={pageSize}
        total={total}
        extra={{ q }}
      />
    </div>
  );
}

import type { Metadata } from "next";

import { AdminDataTable, AdminTd, AdminTh, AdminTr } from "@/components/admin/admin-data-table";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminSearchBar } from "@/components/admin/admin-search-bar";
import { parsePaginationParams } from "@/lib/admin/search-params";
import { formatAdminDate, shortId } from "@/lib/admin/format";
import { ROUTES } from "@/lib/constants";
import { getAdminDownloadsList } from "@/services/admin/downloads";

export const metadata: Metadata = {
  title: "Admin · Downloads",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminDownloadsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const { page, pageSize, q } = parsePaginationParams(sp);
  const { rows, total } = await getAdminDownloadsList({ page, pageSize, q });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">Downloads</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          PDF generation records (storage path is internal; not a public link).
        </p>
      </div>

      <AdminSearchBar
        actionPath={ROUTES.admin.downloads}
        defaultQuery={q ?? ""}
        placeholder="Search filename, path, user, or project id…"
      />

      <AdminDataTable>
        <thead>
          <tr>
            <AdminTh>When</AdminTh>
            <AdminTh>User</AdminTh>
            <AdminTh>Project</AdminTh>
            <AdminTh>File</AdminTh>
            <AdminTh>Size</AdminTh>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <AdminTr>
              <AdminTd colSpan={5} className="text-muted-foreground">
                No downloads match your filters.
              </AdminTd>
            </AdminTr>
          ) : (
            rows.map(({ download, userDisplayName, projectTitle }) => (
              <AdminTr key={download.id}>
                <AdminTd className="whitespace-nowrap text-muted-foreground">
                  {formatAdminDate(download.created_at)}
                </AdminTd>
                <AdminTd>
                  {userDisplayName ?? "—"}
                  <br />
                  <span className="font-mono text-xs text-muted-foreground">{shortId(download.user_id, 10)}</span>
                </AdminTd>
                <AdminTd>
                  {projectTitle ?? "—"}
                  <br />
                  <span className="font-mono text-xs text-muted-foreground" title={download.project_id}>
                    {shortId(download.project_id, 10)}
                  </span>
                </AdminTd>
                <AdminTd className="max-w-[220px] break-all text-xs">
                  {download.file_name ?? "—"}
                  <br />
                  <span className="text-muted-foreground">{download.mime_type}</span>
                </AdminTd>
                <AdminTd className="tabular-nums text-xs">
                  {download.bytes != null ? `${(download.bytes / 1024).toFixed(1)} KB` : "—"}
                </AdminTd>
              </AdminTr>
            ))
          )}
        </tbody>
      </AdminDataTable>

      <AdminPagination
        path={ROUTES.admin.downloads}
        page={page}
        pageSize={pageSize}
        total={total}
        extra={{ q }}
      />
    </div>
  );
}

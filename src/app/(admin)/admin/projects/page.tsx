import type { Metadata } from "next";

import { AdminDataTable, AdminTd, AdminTh, AdminTr } from "@/components/admin/admin-data-table";
import { AdminFilterChips } from "@/components/admin/admin-filter-chips";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminSearchBar } from "@/components/admin/admin-search-bar";
import { parsePaginationParams, parseStatusParam } from "@/lib/admin/search-params";
import { formatAdminDate, shortId } from "@/lib/admin/format";
import { ROUTES } from "@/lib/constants";
import { getAdminProjectsList } from "@/services/admin/projects";

export const metadata: Metadata = {
  title: "Admin · Projects",
  robots: { index: false, follow: false },
};

const STATUSES = ["draft", "archived", "published"] as const;

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminProjectsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const { page, pageSize, q } = parsePaginationParams(sp);
  const status = parseStatusParam(sp, STATUSES) as (typeof STATUSES)[number] | undefined;

  const { rows, total } = await getAdminProjectsList({
    page,
    pageSize,
    q,
    status,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">Projects</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Resume projects across all users (soft-deleted rows excluded).
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <AdminFilterChips
          basePath={ROUTES.admin.projects}
          paramName="status"
          items={[
            { label: "All" },
            { label: "Draft", paramValue: "draft" },
            { label: "Published", paramValue: "published" },
            { label: "Archived", paramValue: "archived" },
          ]}
          current={status}
          preserve={{ q, pageSize: String(pageSize) }}
        />
        <AdminSearchBar
          actionPath={ROUTES.admin.projects}
          defaultQuery={q ?? ""}
          hiddenFields={{ pageSize: String(pageSize), ...(status ? { status } : {}) }}
          placeholder="Search title, slug, or id…"
        />
      </div>

      <AdminDataTable>
        <thead>
          <tr>
            <AdminTh>Project</AdminTh>
            <AdminTh>Owner</AdminTh>
            <AdminTh>Status</AdminTh>
            <AdminTh>Updated</AdminTh>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <AdminTr>
              <AdminTd colSpan={4} className="text-muted-foreground">
                No projects match your filters.
              </AdminTd>
            </AdminTr>
          ) : (
            rows.map(({ project, ownerDisplayName }) => (
              <AdminTr key={project.id}>
                <AdminTd>
                  <span className="font-medium">{project.title}</span>
                  <br />
                  <span className="text-xs text-muted-foreground">{project.slug}</span>
                  <br />
                  <span className="font-mono text-xs text-muted-foreground" title={project.id}>
                    {shortId(project.id, 12)}
                  </span>
                </AdminTd>
                <AdminTd>{ownerDisplayName ?? "—"}</AdminTd>
                <AdminTd className="capitalize">{project.status}</AdminTd>
                <AdminTd className="whitespace-nowrap text-muted-foreground">
                  {formatAdminDate(project.updated_at)}
                </AdminTd>
              </AdminTr>
            ))
          )}
        </tbody>
      </AdminDataTable>

      <AdminPagination
        path={ROUTES.admin.projects}
        page={page}
        pageSize={pageSize}
        total={total}
        extra={{ q, status }}
      />
    </div>
  );
}

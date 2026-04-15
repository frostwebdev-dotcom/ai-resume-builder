import type { Metadata } from "next";

import { AdminDataTable, AdminTd, AdminTh, AdminTr } from "@/components/admin/admin-data-table";
import { AdminFilterChips } from "@/components/admin/admin-filter-chips";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminSearchBar } from "@/components/admin/admin-search-bar";
import { parseOkParam, parsePaginationParams } from "@/lib/admin/search-params";
import { formatAdminDate, shortId } from "@/lib/admin/format";
import { ROUTES } from "@/lib/constants";
import { getAdminAiUsageList } from "@/services/admin/ai-usage";

export const metadata: Metadata = {
  title: "Admin · AI usage",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminAiUsagePage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const { page, pageSize, q } = parsePaginationParams(sp);
  const ok = parseOkParam(sp);

  const { rows, total } = await getAdminAiUsageList({
    page,
    pageSize,
    q,
    ok,
  });

  const okParam = ok === "all" ? undefined : ok;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">AI usage</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Generation requests and outcomes (tokens and latency when logged).
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <AdminFilterChips
          basePath={ROUTES.admin.aiUsage}
          paramName="ok"
          items={[
            { label: "All" },
            { label: "Success", paramValue: "ok" },
            { label: "Errors", paramValue: "error" },
          ]}
          current={okParam}
          preserve={{ q, pageSize: String(pageSize) }}
        />
        <AdminSearchBar
          actionPath={ROUTES.admin.aiUsage}
          defaultQuery={q ?? ""}
          hiddenFields={{
            pageSize: String(pageSize),
            ...(okParam ? { ok: okParam } : {}),
          }}
          placeholder="Search model, provider, error code, or id…"
        />
      </div>

      <AdminDataTable>
        <thead>
          <tr>
            <AdminTh>When</AdminTh>
            <AdminTh>User</AdminTh>
            <AdminTh>Model</AdminTh>
            <AdminTh>Tokens</AdminTh>
            <AdminTh>Latency</AdminTh>
            <AdminTh>Result</AdminTh>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <AdminTr>
              <AdminTd colSpan={6} className="text-muted-foreground">
                No AI logs match your filters.
              </AdminTd>
            </AdminTr>
          ) : (
            rows.map(({ log, userDisplayName }) => (
              <AdminTr key={log.id}>
                <AdminTd className="whitespace-nowrap text-muted-foreground">
                  {formatAdminDate(log.created_at)}
                </AdminTd>
                <AdminTd>
                  {userDisplayName ?? "—"}
                  <br />
                  <span className="font-mono text-xs text-muted-foreground" title={log.user_id}>
                    {shortId(log.user_id, 10)}
                  </span>
                </AdminTd>
                <AdminTd className="font-mono text-xs">
                  {log.model ?? "—"}
                  <br />
                  <span className="text-muted-foreground">{log.provider}</span>
                </AdminTd>
                <AdminTd className="tabular-nums text-xs">
                  {log.tokens_prompt != null || log.tokens_completion != null ? (
                    <>
                      {log.tokens_prompt ?? "—"} + {log.tokens_completion ?? "—"}
                    </>
                  ) : (
                    "—"
                  )}
                </AdminTd>
                <AdminTd className="tabular-nums text-xs">
                  {log.latency_ms != null ? `${log.latency_ms} ms` : "—"}
                </AdminTd>
                <AdminTd>
                  {log.ok ? (
                    <span className="text-success">OK</span>
                  ) : (
                    <span className="text-destructive">{log.error_code ?? "Error"}</span>
                  )}
                </AdminTd>
              </AdminTr>
            ))
          )}
        </tbody>
      </AdminDataTable>

      <AdminPagination
        path={ROUTES.admin.aiUsage}
        page={page}
        pageSize={pageSize}
        total={total}
        extra={{ q, ok: okParam }}
      />
    </div>
  );
}

import type { Metadata } from "next";

import { AdminDataTable, AdminTd, AdminTh, AdminTr } from "@/components/admin/admin-data-table";
import { AdminFilterChips } from "@/components/admin/admin-filter-chips";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminSearchBar } from "@/components/admin/admin-search-bar";
import { parsePaginationParams, parseStatusParam } from "@/lib/admin/search-params";
import { formatAdminDate, formatAdminMoney, shortId } from "@/lib/admin/format";
import { ROUTES } from "@/lib/constants";
import type { Order } from "@/types/database";
import { getAdminOrdersList } from "@/services/admin/orders";

export const metadata: Metadata = {
  title: "Admin · Orders",
  robots: { index: false, follow: false },
};

const STATUSES: Order["status"][] = ["pending", "processing", "completed", "failed", "refunded"];

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const { page, pageSize, q } = parsePaginationParams(sp);
  const status = parseStatusParam(sp, STATUSES) as Order["status"] | undefined;

  const { rows, total } = await getAdminOrdersList({ page, pageSize, q, status });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          Orders & payments
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Checkout orders with linked payment rows when present.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <AdminFilterChips
          basePath={ROUTES.admin.orders}
          paramName="status"
          items={[
            { label: "All" },
            { label: "Pending", paramValue: "pending" },
            { label: "Processing", paramValue: "processing" },
            { label: "Completed", paramValue: "completed" },
            { label: "Failed", paramValue: "failed" },
            { label: "Refunded", paramValue: "refunded" },
          ]}
          current={status}
          preserve={{ q, pageSize: String(pageSize) }}
        />
        <AdminSearchBar
          actionPath={ROUTES.admin.orders}
          defaultQuery={q ?? ""}
          hiddenFields={{ pageSize: String(pageSize), ...(status ? { status } : {}) }}
          placeholder="Search SKU, order id, or user id…"
        />
      </div>

      <AdminDataTable>
        <thead>
          <tr>
            <AdminTh>Order</AdminTh>
            <AdminTh>Customer</AdminTh>
            <AdminTh>Product</AdminTh>
            <AdminTh>Amount</AdminTh>
            <AdminTh>Payment</AdminTh>
            <AdminTh>Created</AdminTh>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <AdminTr>
              <AdminTd colSpan={6} className="text-muted-foreground">
                No orders match your filters.
              </AdminTd>
            </AdminTr>
          ) : (
            rows.map(({ order, userDisplayName, payment }) => (
              <AdminTr key={order.id}>
                <AdminTd>
                  <span className="font-mono text-xs" title={order.id}>
                    {shortId(order.id, 10)}
                  </span>
                  <br />
                  <span className="text-xs capitalize text-muted-foreground">{order.status}</span>
                </AdminTd>
                <AdminTd>
                  {userDisplayName ?? "—"}
                  <br />
                  <span className="font-mono text-xs text-muted-foreground" title={order.user_id}>
                    {shortId(order.user_id, 10)}
                  </span>
                </AdminTd>
                <AdminTd>
                  <span className="font-mono text-xs">{order.product_sku}</span>
                  {order.project_id ? (
                    <>
                      <br />
                      <span className="text-xs text-muted-foreground" title={order.project_id}>
                        project {shortId(order.project_id, 8)}
                      </span>
                    </>
                  ) : null}
                </AdminTd>
                <AdminTd className="tabular-nums">
                  {formatAdminMoney(order.amount_cents, order.currency)}
                </AdminTd>
                <AdminTd className="text-xs">
                  {payment ? (
                    <>
                      <span className="capitalize">{payment.status}</span>
                      {payment.stripe_payment_intent_id ? (
                        <>
                          <br />
                          <span className="font-mono text-muted-foreground" title={payment.stripe_payment_intent_id}>
                            pi {shortId(payment.stripe_payment_intent_id, 12)}
                          </span>
                        </>
                      ) : null}
                    </>
                  ) : (
                    "—"
                  )}
                </AdminTd>
                <AdminTd className="whitespace-nowrap text-muted-foreground">
                  {formatAdminDate(order.created_at)}
                </AdminTd>
              </AdminTr>
            ))
          )}
        </tbody>
      </AdminDataTable>

      <AdminPagination
        path={ROUTES.admin.orders}
        page={page}
        pageSize={pageSize}
        total={total}
        extra={{ q, status }}
      />
    </div>
  );
}

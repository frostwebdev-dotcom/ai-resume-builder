import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AdminPaginationProps = {
  path: string;
  page: number;
  pageSize: number;
  total: number;
  /** Extra query params to preserve (e.g. q, status) */
  extra?: Record<string, string | undefined>;
};

function buildHref(
  path: string,
  page: number,
  pageSize: number,
  extra?: Record<string, string | undefined>,
): string {
  const u = new URLSearchParams();
  u.set("page", String(page));
  u.set("pageSize", String(pageSize));
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      if (v !== undefined && v !== "") u.set(k, v);
    }
  }
  return `${path}?${u.toString()}`;
}

export function AdminPagination({ path, page, pageSize, total, extra }: AdminPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  return (
    <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        {total === 0 ? (
          "No results"
        ) : (
          <>
            Showing <span className="font-medium text-foreground">{from}</span>–
            <span className="font-medium text-foreground">{to}</span> of{" "}
            <span className="font-medium text-foreground">{total}</span>
          </>
        )}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </span>
        <Link
          href={buildHref(path, Math.max(1, page - 1), pageSize, extra)}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), page <= 1 && "pointer-events-none opacity-40")}
          aria-disabled={page <= 1}
        >
          Previous
        </Link>
        <Link
          href={buildHref(path, Math.min(totalPages, page + 1), pageSize, extra)}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            page >= totalPages && "pointer-events-none opacity-40",
          )}
          aria-disabled={page >= totalPages}
        >
          Next
        </Link>
      </div>
    </div>
  );
}

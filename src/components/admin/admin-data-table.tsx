import { cn } from "@/lib/utils";

type AdminDataTableProps = {
  children: React.ReactNode;
  className?: string;
};

/** Horizontal scroll on small screens; readable on tablet/desktop. */
export function AdminDataTable({ children, className }: AdminDataTableProps) {
  return (
    <div
      className={cn(
        "-mx-1 min-w-0 overflow-x-auto overscroll-x-contain rounded-xl border border-border/70 bg-card shadow-soft",
        className,
      )}
    >
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        {children}
      </table>
    </div>
  );
}

export function AdminTh({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "border-b border-border/70 bg-muted/40 px-4 py-3 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground first:rounded-tl-xl last:rounded-tr-xl",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function AdminTd({
  children,
  className,
  colSpan,
}: {
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td
      colSpan={colSpan}
      className={cn(
        "border-b border-border/60 px-4 py-3 align-top text-foreground last:pr-5",
        className,
      )}
    >
      {children}
    </td>
  );
}

export function AdminTr({ children }: { children: React.ReactNode }) {
  return (
    <tr className="transition-colors last:[&_td]:border-b-0 hover:bg-brand-muted/40">
      {children}
    </tr>
  );
}

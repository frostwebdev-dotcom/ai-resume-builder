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
        "-mx-1 overflow-x-auto rounded-lg border border-border bg-card shadow-sm",
        className,
      )}
    >
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">{children}</table>
    </div>
  );
}

export function AdminTh({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        "border-b border-border bg-muted/40 px-3 py-3 font-medium text-foreground first:rounded-tl-lg last:rounded-tr-lg sm:px-4",
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
      className={cn("border-b border-border/80 px-3 py-2.5 align-top text-foreground sm:px-4", className)}
    >
      {children}
    </td>
  );
}

export function AdminTr({ children }: { children: React.ReactNode }) {
  return <tr className="hover:bg-muted/30">{children}</tr>;
}

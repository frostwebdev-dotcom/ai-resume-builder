import { cn } from "@/lib/utils";
import type { ProjectDisplayStatus } from "@/lib/projects/display-status";

type ProjectStatusBadgeProps = {
  label: string;
  displayStatus: ProjectDisplayStatus;
  isArchived: boolean;
  className?: string;
};

export function ProjectStatusBadge({
  label,
  displayStatus,
  isArchived,
  className,
}: ProjectStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        isArchived && "bg-muted/80 text-muted-foreground ring-border",
        !isArchived &&
          displayStatus === "draft" &&
          "bg-muted/80 text-muted-foreground ring-border",
        !isArchived &&
          displayStatus === "ready_for_preview" &&
          "bg-info/15 text-info ring-info/25",
        !isArchived &&
          displayStatus === "paid" &&
          "bg-warning/15 text-warning-foreground ring-warning/30",
        !isArchived &&
          displayStatus === "downloaded" &&
          "bg-success/12 text-success ring-success/25",
        className,
      )}
    >
      <span className="truncate">{label}</span>
    </span>
  );
}

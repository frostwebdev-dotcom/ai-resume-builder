"use client";

import {
  Copy,
  Eye,
  MoreVertical,
  NotebookPen,
  Pencil,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";

import { DeleteProjectDialog } from "@/components/projects/delete-project-dialog";
import { RenameProjectDialog } from "@/components/projects/rename-project-dialog";
import { TemplateCatalogLivePreview } from "@/components/templates/template-catalog-live-preview";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROUTES } from "@/lib/constants";
import { templateIdToSlug } from "@/lib/resume-preview/resolve-slug";
import { duplicateProjectAction } from "@/services/projects/actions";
import type { DashboardProject } from "@/services/projects/queries";
import { cn } from "@/lib/utils";

/** Same outer width/height as the dashboard “Create new resume” dashed tile (A4 ratio). */
export const dashboardResumeStripFrameClass =
  "h-[calc(11.5rem*297/210)] w-[11.5rem] shrink-0 sm:h-[calc(12.5rem*297/210)] sm:w-[12.5rem]";

export function formatProjectEdited(iso: string) {
  try {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const h = Math.floor(diff / 3600000);
    if (h < 1) return "just now";
    if (h === 1) return "1 hour ago";
    if (h < 24) return `${h} hours ago`;
    const days = Math.floor(h / 24);
    if (days === 1) return "a day ago";
    if (days < 7) return `${days} days ago`;
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(d);
  } catch {
    return "";
  }
}

type ProjectResumePreviewCardProps = {
  project: DashboardProject;
  /** Narrower max width for horizontal strips (e.g. dashboard). Ignored when `strip` is true. */
  compact?: boolean;
  /** Fixed footprint matching `dashboardResumeStripFrameClass` (dashboard Recent resumes). */
  strip?: boolean;
};

/**
 * Resume project preview: thumbnail + kebab + title + edited line — matches `/app/resumes` grid cards.
 */
export function ProjectResumePreviewCard({
  project,
  compact = false,
  strip = false,
}: ProjectResumePreviewCardProps) {
  const slug = templateIdToSlug(project.templateId);
  const href = project.isArchived
    ? ROUTES.app.project(project.id)
    : ROUTES.app.projectBuild(project.id);
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [dupPending, startDup] = useTransition();

  function runDuplicate() {
    const fd = new FormData();
    fd.set("projectId", project.id);
    startDup(() => {
      void duplicateProjectAction({}, fd);
    });
  }

  const widthClass = strip
    ? dashboardResumeStripFrameClass
    : compact
      ? "w-full max-w-[11.5rem] sm:max-w-[12.5rem]"
      : "w-full max-w-[12.5rem] sm:max-w-[13.5rem]";

  return (
    <>
      <article
        className={cn(
          "flex min-w-0 flex-col",
          strip ? cn(widthClass, "group/rs overflow-hidden") : cn("w-full", widthClass),
        )}
      >
        <div className={cn("relative w-full", strip && "min-h-0 flex-1 overflow-hidden")}>
          <Link
            href={href}
            className={cn(
              "absolute inset-0 z-0 outline-none ring-slate-400/0 transition-[box-shadow,ring-color] focus-visible:ring-2 focus-visible:ring-[#2268d7]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
              strip ? "rounded-md" : "rounded-sm",
            )}
            aria-label={`Open ${project.title}`}
          >
            <span className="sr-only">Open resume</span>
          </Link>
          <div
            className={cn(
              "pointer-events-none relative z-[1] overflow-hidden bg-white",
              strip
                ? cn(
                    "h-full rounded-md p-1.5",
                    "shadow-[0_1px_2px_rgba(15,23,42,0.05),0_4px_14px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.85)]",
                    "ring-1 ring-slate-200/50",
                    "transition-[box-shadow,ring-color] duration-200 ease-out",
                    "group-hover/rs:shadow-[0_2px_6px_rgba(15,23,42,0.07),0_10px_28px_rgba(15,23,42,0.09),inset_0_1px_0_rgba(255,255,255,0.9)]",
                    "group-hover/rs:ring-slate-300/70",
                  )
                : cn(
                    "rounded-sm shadow-[0_3px_14px_rgba(15,23,42,0.08),0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-900/[0.04]",
                  ),
            )}
          >
            <div className={cn("relative z-[1]", !strip && "p-1.5")}>
              <TemplateCatalogLivePreview
                slug={slug}
                className="w-full rounded-none shadow-none ring-0"
              />
            </div>
          </div>
          <div className="pointer-events-none absolute inset-0 z-[2]">
            <div className="pointer-events-auto absolute bottom-2 right-2">
              <DropdownMenu>
                <DropdownMenuTrigger
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  className={cn(
                    "inline-flex size-8 items-center justify-center rounded-full border-0 bg-white text-slate-600 shadow-[0_2px_8px_rgba(15,23,42,0.12)] outline-none transition-[transform,box-shadow,background-color] duration-150",
                    "hover:bg-white hover:text-slate-800 hover:shadow-[0_3px_10px_rgba(15,23,42,0.14)] active:scale-[0.97]",
                    "focus-visible:ring-2 focus-visible:ring-[#2268d7]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                  )}
                  aria-label={`Actions for ${project.title}`}
                >
                  <MoreVertical className="size-4" strokeWidth={2} aria-hidden />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[11rem]">
                  <DropdownMenuItem
                    render={
                      <Link href={ROUTES.app.project(project.id)} className="cursor-pointer" />
                    }
                  >
                    <Eye className="size-4 opacity-70" aria-hidden />
                    Open
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    render={
                      <Link href={ROUTES.app.projectBuild(project.id)} className="cursor-pointer" />
                    }
                  >
                    <NotebookPen className="size-4 opacity-70" aria-hidden />
                    Open draft
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setRenameOpen(true)} className="cursor-pointer">
                    <Pencil className="size-4 opacity-70" aria-hidden />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled={dupPending} onClick={runDuplicate} className="cursor-pointer">
                    <Copy className="size-4 opacity-70" aria-hidden />
                    {dupPending ? "Duplicating…" : "Duplicate"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => setDeleteOpen(true)}
                    className="cursor-pointer"
                  >
                    <Trash2 className="size-4 opacity-70" aria-hidden />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
        <Link
          href={href}
          className={cn(
            "relative z-[1] block min-w-0 rounded-sm py-0.5 outline-none ring-slate-400/0 transition-colors hover:text-slate-800 focus-visible:ring-2 focus-visible:ring-[#2268d7]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
            strip ? "mt-1 shrink-0" : "mt-1.5",
          )}
        >
          <p
            className={cn(
              "line-clamp-2 text-left font-bold leading-snug tracking-tight text-slate-900",
              strip ? "text-xs" : "text-sm",
            )}
          >
            {project.title}
          </p>
          <p className="mt-0.5 text-left text-[0.65rem] leading-snug text-slate-500 sm:text-xs">
            Edited {formatProjectEdited(project.updatedAt)}
          </p>
        </Link>
      </article>

      <RenameProjectDialog
        projectId={project.id}
        title={project.title}
        open={renameOpen}
        onOpenChange={setRenameOpen}
      />
      <DeleteProjectDialog
        projectId={project.id}
        title={project.title}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
}

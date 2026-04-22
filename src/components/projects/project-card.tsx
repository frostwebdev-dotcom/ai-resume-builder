"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Copy,
  Eye,
  CheckCircle2,
  NotebookPen,
} from "lucide-react";

import type { DashboardProject } from "@/services/projects/queries";
import {
  duplicateProjectAction,
  markReadyForPreviewAction,
} from "@/services/projects/actions";
import { DeleteProjectDialog } from "@/components/projects/delete-project-dialog";
import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
import { RenameProjectDialog } from "@/components/projects/rename-project-dialog";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { templateIdToSlug } from "@/lib/resume-preview/resolve-slug";
import { getTemplateTheme } from "@/lib/resume-preview/template-theme";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

function formatUpdated(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
      new Date(iso),
    );
  } catch {
    return "";
  }
}

type ProjectCardProps = {
  project: DashboardProject;
};

export function ProjectCard({ project }: ProjectCardProps) {
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [dupPending, startDup] = useTransition();
  const [readyPending, startReady] = useTransition();

  function runDuplicate() {
    const fd = new FormData();
    fd.set("projectId", project.id);
    startDup(() => {
      void duplicateProjectAction({}, fd);
    });
  }

  function runMarkReady() {
    const fd = new FormData();
    fd.set("projectId", project.id);
    startReady(() => {
      void markReadyForPreviewAction({}, fd);
    });
  }

  const showMarkReady =
    !project.isArchived && project.displayStatus === "draft";

  const slug = templateIdToSlug(project.templateId);
  const theme = getTemplateTheme(slug);

  return (
    <>
      <Card
        size="sm"
        interactive={!project.isArchived}
        className={cn(project.isArchived && "opacity-90")}
      >
        <CardHeader className="gap-3 border-b border-border/70 pb-3 [.border-b]:pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <Link
                href={ROUTES.app.project(project.id)}
                className="font-heading text-base font-semibold tracking-tight text-foreground underline-offset-4 hover:underline"
              >
                <span className="line-clamp-2">{project.title}</span>
              </Link>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                <span
                  aria-hidden
                  className="inline-block size-2 rounded-full ring-1 ring-black/5"
                  style={{ backgroundColor: theme.accentStrong }}
                />
                <span className="font-medium text-foreground/80">
                  {theme.name}
                </span>
                <span className="opacity-60">•</span>
                <span>Updated {formatUpdated(project.updatedAt)}</span>
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger
                type="button"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon-sm" }),
                  "shrink-0",
                )}
                aria-label={`Actions for ${project.title}`}
              >
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[12rem]">
                <DropdownMenuItem
                  render={
                    <Link
                      href={ROUTES.app.project(project.id)}
                      className="cursor-pointer"
                    />
                  }
                >
                  <Eye className="size-4 opacity-70" aria-hidden />
                  Open
                </DropdownMenuItem>
                <DropdownMenuItem
                  render={
                    <Link
                      href={ROUTES.app.projectBuild(project.id)}
                      className="cursor-pointer"
                    />
                  }
                >
                  <NotebookPen className="size-4 opacity-70" aria-hidden />
                  Open draft
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setRenameOpen(true)}
                  className="cursor-pointer"
                >
                  <Pencil className="size-4 opacity-70" aria-hidden />
                  Rename
                </DropdownMenuItem>
                {showMarkReady ? (
                  <DropdownMenuItem
                    disabled={readyPending}
                    onClick={runMarkReady}
                    className="cursor-pointer"
                  >
                    <CheckCircle2 className="size-4 opacity-70" aria-hidden />
                    {readyPending ? "Updating…" : "Mark ready for preview"}
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem
                  disabled={dupPending}
                  onClick={runDuplicate}
                  className="cursor-pointer"
                >
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
          <ProjectStatusBadge
            label={project.displayLabel}
            displayStatus={project.displayStatus}
            isArchived={project.isArchived}
          />
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground">
            {project.isArchived
              ? "Archived — open to review or duplicate."
              : "Open to edit content, preview, and export when you are ready."}
          </p>
        </CardContent>
        <CardFooter className="border-t border-border/60 bg-muted/20 px-4 py-3 [.border-t]:pt-3">
          <Link
            href={ROUTES.app.project(project.id)}
            className={cn(
              buttonVariants({ size: "sm" }),
              "w-full min-h-11 justify-center bg-brand text-brand-foreground hover:bg-brand/90 sm:w-auto sm:min-h-9",
            )}
          >
            Open
          </Link>
        </CardFooter>
      </Card>

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

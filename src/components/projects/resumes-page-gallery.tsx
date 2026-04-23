"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  Copy,
  Eye,
  LayoutGrid,
  List,
  MoreVertical,
  NotebookPen,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useState, useTransition } from "react";

import { useAppLoginPanel } from "@/components/layout/app-login-panel";
import { DeleteProjectDialog } from "@/components/projects/delete-project-dialog";
import { ProjectCard } from "@/components/projects/project-card";
import { RenameProjectDialog } from "@/components/projects/rename-project-dialog";
import { createProjectAction, duplicateProjectAction } from "@/services/projects/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DashboardProject } from "@/services/projects/queries";
import { templateIdToSlug } from "@/lib/resume-preview/resolve-slug";
import { getTemplateTheme } from "@/lib/resume-preview/template-theme";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Props = {
  projects: DashboardProject[];
  /** When true, skip server create actions and link to `/create`; show sign-in CTA. */
  guest?: boolean;
};

type ViewMode = "grid" | "list";

function formatEdited(iso: string) {
  try {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const h = Math.floor(diff / 3600000);
    if (h < 1) return "Just now";
    if (h === 1) return "1 hour ago";
    if (h < 24) return `${h} hours ago`;
    const days = Math.floor(h / 24);
    if (days === 1) return "1 day ago";
    if (days < 7) return `${days} days ago`;
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(d);
  } catch {
    return "";
  }
}

function ResumeGridTile({ project }: { project: DashboardProject }) {
  const slug = templateIdToSlug(project.templateId);
  const theme = getTemplateTheme(slug);
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

  return (
    <>
      <article className="relative w-[9.5rem] shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:border-slate-300 hover:shadow-md sm:w-[10.5rem]">
        <div className="relative h-[6.5rem] bg-slate-100">
          <Link href={href} className="absolute inset-0 z-0 block" aria-label={`Open ${project.title}`}>
            <span className="sr-only">Open resume</span>
          </Link>
          <div
            className="pointer-events-none absolute bottom-0 left-0 top-0 z-[1] w-[22%] min-w-[10px]"
            style={{ backgroundColor: theme.accent }}
            aria-hidden
          />
          <div className="pointer-events-none absolute inset-0 z-[1] flex flex-col gap-1 p-2 pl-[28%] pt-2">
            <span className="h-1 w-3/4 rounded bg-slate-300/90" />
            <span className="h-0.5 w-full rounded bg-slate-200" />
            <span className="h-0.5 w-5/6 rounded bg-slate-200" />
            <span className="h-0.5 w-full rounded bg-slate-200" />
            <span className="mt-auto h-1.5 w-1/3 rounded bg-slate-200" />
          </div>
          <div className="absolute bottom-1.5 right-1.5 z-10">
            <DropdownMenu>
              <DropdownMenuTrigger
                type="button"
                className={cn(
                  buttonVariants({ variant: "secondary", size: "icon-sm" }),
                  "size-7 rounded-full border border-slate-200/90 bg-white/95 shadow-sm hover:bg-white",
                )}
                aria-label={`Actions for ${project.title}`}
              >
                <MoreVertical className="size-3.5 text-slate-600" aria-hidden />
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
        <Link
          href={href}
          className="block border-t border-slate-100 p-2 transition-colors hover:bg-slate-50/80"
        >
          <p className="line-clamp-2 text-xs font-semibold leading-snug text-slate-900">{project.title}</p>
          <p className="mt-0.5 text-[0.65rem] text-slate-500">Edited {formatEdited(project.updatedAt)}</p>
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

const createResumeDashedClass =
  "flex h-[10.5rem] w-[9.5rem] shrink-0 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#2268d7]/50 bg-sky-50/40 p-3 text-[#2268d7] shadow-none transition-colors hover:border-[#2268d7] hover:bg-sky-50/80 hover:text-[#1a56b8] sm:w-[10.5rem]";

function CreateResumeGuestCard() {
  return (
    <Link href={ROUTES.create} className={createResumeDashedClass}>
      <span className="text-center text-xs font-semibold leading-snug">Create new resume</span>
      <Plus className="size-8 stroke-[1.5]" aria-hidden />
    </Link>
  );
}

function CreateResumeCard() {
  const [state, action, pending] = useActionState(createProjectAction, {});

  return (
    <form action={action} className="shrink-0">
      <input type="hidden" name="title" value="Untitled resume" />
      <Button
        type="submit"
        disabled={pending}
        variant="ghost"
        className={createResumeDashedClass}
      >
        <span className="text-center text-xs font-semibold leading-snug">
          {pending ? "Creating…" : "Create new resume"}
        </span>
        <Plus className="size-8 stroke-[1.5]" aria-hidden />
      </Button>
      {state.error ? (
        <p className="mt-2 max-w-[10.5rem] text-center text-xs font-medium text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}

function CreateResumeListRowGuest() {
  return (
    <Link
      href={ROUTES.create}
      className="flex flex-wrap items-center gap-3 rounded-xl border-2 border-dashed border-[#2268d7]/50 bg-sky-50/40 px-4 py-4 text-[#2268d7] sm:px-5"
    >
      <Plus className="size-6 shrink-0 stroke-[1.5]" aria-hidden />
      <span className="min-w-0 flex-1 text-sm font-semibold">Create new resume</span>
      <span
        className={cn(
          buttonVariants({ size: "sm" }),
          "shrink-0 bg-[#2268d7] text-white hover:bg-[#1a56b8]",
        )}
      >
        Open builder
      </span>
    </Link>
  );
}

function CreateResumeListRow() {
  const [state, action, pending] = useActionState(createProjectAction, {});

  return (
    <form
      action={action}
      className="flex flex-wrap items-center gap-3 rounded-xl border-2 border-dashed border-[#2268d7]/50 bg-sky-50/40 px-4 py-4 text-[#2268d7] sm:px-5"
    >
      <input type="hidden" name="title" value="Untitled resume" />
      <Plus className="size-6 shrink-0 stroke-[1.5]" aria-hidden />
      <span className="min-w-0 flex-1 text-sm font-semibold">
        {pending ? "Creating…" : "Create new resume"}
      </span>
      <Button
        type="submit"
        size="sm"
        disabled={pending}
        className="shrink-0 bg-[#2268d7] text-white hover:bg-[#1a56b8]"
      >
        {pending ? "Please wait" : "Create"}
      </Button>
      {state.error ? (
        <p className="w-full text-sm font-medium text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}

export function ResumesPageGallery({ projects, guest = false }: Props) {
  const [view, setView] = useState<ViewMode>("grid");
  const { openLogin } = useAppLoginPanel();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      {guest ? (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm sm:px-5">
          <span className="text-slate-700">
            Sign in to see saved resume projects here. Until then, start a draft on{" "}
            <Link className="font-medium text-[#2268d7] underline-offset-2 hover:underline" href={ROUTES.create}>
              Create
            </Link>{" "}
            (saved in this browser only).
          </span>{" "}
          <button
            type="button"
            onClick={() => openLogin(ROUTES.app.resumes)}
            className="font-semibold text-[#2268d7] underline-offset-2 hover:underline"
          >
            Sign in
          </button>
        </div>
      ) : null}
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Resumes</h1>
        <div
          className="inline-flex shrink-0 rounded-full border border-slate-200 bg-white p-0.5 shadow-sm"
          role="group"
          aria-label="View mode"
        >
          <button
            type="button"
            onClick={() => setView("grid")}
            aria-pressed={view === "grid"}
            className={cn(
              "rounded-full p-2 text-slate-500 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#2268d7]/40",
              view === "grid" && "bg-[#2268d7] text-white shadow-sm",
            )}
          >
            <LayoutGrid className="size-4" aria-hidden />
            <span className="sr-only">Grid view</span>
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            aria-pressed={view === "list"}
            className={cn(
              "rounded-full p-2 text-slate-500 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#2268d7]/40",
              view === "list" && "bg-[#2268d7] text-white shadow-sm",
            )}
          >
            <List className="size-4" aria-hidden />
            <span className="sr-only">List view</span>
          </button>
        </div>
      </div>

      {view === "grid" ? (
        <div className="flex flex-wrap gap-4 pb-2">
          {guest ? <CreateResumeGuestCard /> : <CreateResumeCard />}
          {!guest
            ? projects.map((p) => <ResumeGridTile key={p.id} project={p} />)
            : null}
        </div>
      ) : (
        <div className="space-y-6">
          {guest ? <CreateResumeListRowGuest /> : <CreateResumeListRow />}
          {!guest ? (
            <ul className="grid gap-4 sm:grid-cols-2">
              {projects.map((p) => (
                <li key={p.id}>
                  <ProjectCard project={p} />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}
    </div>
  );
}

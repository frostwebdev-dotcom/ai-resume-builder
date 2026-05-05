"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  Copy,
  Download,
  Eye,
  LayoutGrid,
  List,
  Loader2,
  MoreVertical,
  NotebookPen,
  Pencil,
  Plus,
  Trash2,
  UserPlus,
} from "lucide-react";
import { useState, useTransition } from "react";

import { useAppLoginPanel } from "@/components/layout/app-login-panel";
import { DeleteProjectDialog } from "@/components/projects/delete-project-dialog";
import {
  formatProjectEdited,
  ProjectResumePreviewCard,
} from "@/components/projects/project-resume-preview-card";
import { RenameProjectDialog } from "@/components/projects/rename-project-dialog";
import { TemplateCatalogLivePreview } from "@/components/templates/template-catalog-live-preview";
import { createProjectAction, duplicateProjectAction } from "@/services/projects/actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DashboardProject } from "@/services/projects/queries";
import { templateIdToSlug } from "@/lib/resume-preview/resolve-slug";
import { pageGutterXClass } from "@/components/layout/page-container";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Props = {
  projects: DashboardProject[];
  /** When true, skip server create actions and link to `/create`; show sign-in CTA. */
  guest?: boolean;
};

type ViewMode = "grid" | "list";

const listIconLinkClass = cn(
  "inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-500 outline-none transition-colors",
  "hover:bg-slate-100 hover:text-slate-800",
  "focus-visible:ring-2 focus-visible:ring-[#2268d7]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
);

function ResumeListRow({ project }: { project: DashboardProject }) {
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

  return (
    <div>
      {/*
        Mobile list: explicit horizontal grid — preview column left, text center, actions right.
        Prevents flex quirks on narrow widths; items-start keeps the thumb aligned to the top on phones.
      */}
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-x-3 gap-y-1 px-4 py-3 sm:items-center sm:gap-x-4 sm:gap-y-0 sm:px-5">
        <Link
          href={href}
          className="relative aspect-[210/297] w-[3.35rem] shrink-0 overflow-hidden rounded-md bg-slate-100 ring-1 ring-slate-200/90 transition-opacity hover:opacity-95 sm:w-12"
          aria-label={`Open ${project.title}`}
        >
          <span className="sr-only">Open resume</span>
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden p-0.5">
            <TemplateCatalogLivePreview
              slug={slug}
              className="h-full max-h-full w-full rounded-none shadow-none ring-0"
            />
          </div>
        </Link>

        <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <Link
            href={href}
            className="min-w-0 truncate text-sm font-semibold text-slate-900 underline-offset-2 hover:underline sm:max-w-[min(100%,28rem)] sm:text-base"
          >
            {project.title}
          </Link>
          <p className="shrink-0 text-xs text-slate-400 sm:text-right sm:text-sm">
            Edited {formatProjectEdited(project.updatedAt)}
          </p>
        </div>

        <div className="flex shrink-0 flex-row items-center justify-end gap-0.5 sm:gap-1">
          <Link
            href={ROUTES.app.project(project.id)}
            className={listIconLinkClass}
            aria-label={`Open ${project.title} overview`}
          >
            <Eye className="size-[18px]" strokeWidth={1.75} aria-hidden />
          </Link>
          <Link
            href={ROUTES.app.projectBuild(project.id)}
            className={listIconLinkClass}
            aria-label={`Open ${project.title} in the studio`}
          >
            <UserPlus className="size-[18px]" strokeWidth={1.75} aria-hidden />
          </Link>
          <Link
            href={ROUTES.app.projectPreview(project.id)}
            className={listIconLinkClass}
            aria-label={`Preview and export ${project.title}`}
          >
            <Download className="size-[18px]" strokeWidth={1.75} aria-hidden />
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger
              type="button"
              className={cn(listIconLinkClass, "border-0 bg-transparent")}
              aria-label={`More actions for ${project.title}`}
            >
              <MoreVertical className="size-[18px]" strokeWidth={1.75} aria-hidden />
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
    </div>
  );
}

const createResumeDashedClass = cn(
  "flex w-full min-w-0 max-w-[12.5rem] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-100/90 p-4 text-slate-400 shadow-none sm:max-w-[13.5rem]",
  "aspect-[210/297] transition-[color,background-color,border-color,transform] duration-200",
  "hover:border-slate-400 hover:bg-slate-100 hover:text-slate-500",
);

const createResumeGridSubmitClass = cn(
  createResumeDashedClass,
  "cursor-pointer font-medium outline-none",
  "focus-visible:ring-2 focus-visible:ring-slate-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
  "disabled:pointer-events-none disabled:opacity-60",
);

function CreateResumeGuestCard() {
  return (
    <Link href={ROUTES.create} className={cn(createResumeDashedClass, "outline-none focus-visible:ring-2 focus-visible:ring-slate-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white")}>
      <span className="text-center text-sm font-normal leading-snug">Create new resume</span>
      <Plus className="size-10 stroke-[1.35] text-slate-400" aria-hidden />
    </Link>
  );
}

function CreateResumeCard() {
  const [state, action, pending] = useActionState(createProjectAction, {});

  return (
    <div className="flex w-full min-w-0 max-w-[12.5rem] flex-col gap-2 sm:max-w-[13.5rem]">
      <form action={action} className="w-full">
        <input type="hidden" name="title" value="Untitled resume" />
        <button type="submit" disabled={pending} className={createResumeGridSubmitClass}>
          <span className="text-center text-sm font-normal leading-snug">
            {pending ? "Creating…" : "Create new resume"}
          </span>
          {pending ? (
            <Loader2 className="size-10 animate-spin stroke-[1.35] text-slate-400" aria-hidden />
          ) : (
            <Plus className="size-10 stroke-[1.35] text-slate-400" aria-hidden />
          )}
        </button>
      </form>
      {state.error ? (
        <p className="text-xs font-medium text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
    </div>
  );
}

/** First row inside list panel — guest (link to public builder). */
function CreateResumeListFirstRowGuest() {
  return (
    <Link
      href={ROUTES.create}
      className="flex w-full items-center gap-3 px-4 py-3.5 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 sm:px-5"
    >
      <Plus className="size-5 shrink-0 stroke-[1.5]" aria-hidden />
      <span className="text-sm font-medium">Create new resume</span>
    </Link>
  );
}

/** First row inside list panel — signed-in (server create). */
function CreateResumeListFirstRow() {
  const [state, action, pending] = useActionState(createProjectAction, {});

  return (
    <div>
      <form action={action}>
        <input type="hidden" name="title" value="Untitled resume" />
        <button
          type="submit"
          disabled={pending}
          className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 disabled:opacity-60 sm:px-5"
        >
          {pending ? (
            <Loader2 className="size-5 shrink-0 animate-spin stroke-[1.5]" aria-hidden />
          ) : (
            <Plus className="size-5 shrink-0 stroke-[1.5]" aria-hidden />
          )}
          <span className="text-sm font-medium">{pending ? "Creating…" : "Create new resume"}</span>
        </button>
      </form>
      {state.error ? (
        <p className="border-t border-slate-100 px-4 py-2 text-xs font-medium text-destructive sm:px-5" role="alert">
          {state.error}
        </p>
      ) : null}
    </div>
  );
}

export function ResumesPageGallery({ projects, guest = false }: Props) {
  const [view, setView] = useState<ViewMode>("grid");
  const { openLogin } = useAppLoginPanel();

  return (
    <div className={cn("mx-auto w-full min-w-0 max-w-6xl py-6 sm:py-8", pageGutterXClass)}>
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
      <div className="mb-6 flex min-w-0 flex-wrap items-center justify-between gap-3 gap-y-2 sm:gap-4">
        <h1 className="min-w-0 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Resumes
        </h1>
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
        <div className="grid grid-cols-[repeat(auto-fill,minmax(10.75rem,1fr))] justify-items-start gap-x-6 gap-y-8 pb-2 sm:grid-cols-[repeat(auto-fill,minmax(11.75rem,1fr))]">
          {guest ? <CreateResumeGuestCard /> : <CreateResumeCard />}
          {!guest
            ? projects.map((p) => <ProjectResumePreviewCard key={p.id} project={p} />)
            : null}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="divide-y divide-slate-100">
            {guest ? <CreateResumeListFirstRowGuest /> : <CreateResumeListFirstRow />}
            {!guest ? projects.map((p) => <ResumeListRow key={p.id} project={p} />) : null}
          </div>
        </div>
      )}
    </div>
  );
}

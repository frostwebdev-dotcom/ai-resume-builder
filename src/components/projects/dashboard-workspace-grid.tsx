"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Settings,
  FileText,
  LayoutDashboard,
  LayoutTemplate,
  Plus,
} from "lucide-react";

import type { DashboardProject } from "@/services/projects/queries";
import { templateIdToSlug } from "@/lib/resume-preview/resolve-slug";
import { getTemplateTheme } from "@/lib/resume-preview/template-theme";
import { APP_NAME, ROUTES } from "@/lib/constants";

function formatEdited(iso: string) {
  try {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const h = Math.floor(diff / 3600000);
    if (h < 1) return "Just now";
    if (h < 24) return `${h}h ago`;
    const days = Math.floor(h / 24);
    if (days < 7) return `${days}d ago`;
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(d);
  } catch {
    return "";
  }
}

function PanelChrome({
  title,
  href,
  children,
  icon: Icon,
}: {
  title: string;
  href: string;
  children: ReactNode;
  icon: typeof FileText;
}) {
  return (
    <section
      className="flex min-h-0 min-w-0 flex-col rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-5"
      aria-labelledby={`panel-${title.replace(/\s+/g, "-").toLowerCase()}`}
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Icon className="size-4 shrink-0 text-slate-500" aria-hidden />
          <h2
            id={`panel-${title.replace(/\s+/g, "-").toLowerCase()}`}
            className="truncate text-sm font-semibold tracking-tight text-slate-900"
          >
            {title}
          </h2>
        </div>
        <Link
          href={href}
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
          aria-label={`Open ${title}`}
        >
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  );
}

function ResumeThumb({ project }: { project: DashboardProject }) {
  const slug = templateIdToSlug(project.templateId);
  const theme = getTemplateTheme(slug);
  const href = project.isArchived
    ? ROUTES.app.project(project.id)
    : ROUTES.app.projectBuild(project.id);

  return (
    <Link
      href={href}
      className="group/thumb flex w-[9.5rem] shrink-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:border-slate-300 hover:shadow-md sm:w-[10.5rem]"
    >
      <div className="relative h-[6.5rem] bg-slate-100">
        <div
          className="absolute bottom-0 left-0 top-0 w-[22%] min-w-[10px]"
          style={{ backgroundColor: theme.accent }}
          aria-hidden
        />
        <div className="absolute inset-0 flex flex-col gap-1 p-2 pl-[28%] pt-2">
          <span className="h-1 w-3/4 rounded bg-slate-300/90" />
          <span className="h-0.5 w-full rounded bg-slate-200" />
          <span className="h-0.5 w-5/6 rounded bg-slate-200" />
          <span className="h-0.5 w-full rounded bg-slate-200" />
          <span className="mt-auto h-1.5 w-1/3 rounded bg-slate-200" />
        </div>
      </div>
      <div className="border-t border-slate-100 p-2">
        <p className="line-clamp-2 text-xs font-semibold leading-snug text-slate-900">{project.title}</p>
        <p className="mt-0.5 text-[0.65rem] text-slate-500">Edited {formatEdited(project.updatedAt)}</p>
      </div>
    </Link>
  );
}

type Props = {
  projects: DashboardProject[];
};

/**
 * Signed-in dashboard home: workspace hub (resumes + templates).
 */
export function DashboardWorkspaceGrid({ projects }: Props) {
  const topProjects = projects.slice(0, 6);

  return (
    <div className="grid min-h-0 flex-1 auto-rows-fr gap-4 lg:grid-cols-2 lg:gap-5">
      <PanelChrome title="Resumes" href={ROUTES.app.resumes} icon={FileText}>
        <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:thin]">
          <Link
            href={ROUTES.create}
            className="flex h-[10.5rem] w-[9.5rem] shrink-0 flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/80 text-slate-600 transition-colors hover:border-slate-400 hover:bg-slate-100 hover:text-slate-900 sm:w-[10.5rem]"
          >
            <Plus className="size-8 stroke-[1.25]" aria-hidden />
            <span className="mt-2 text-center text-xs font-semibold">Create new resume</span>
          </Link>
          {topProjects.map((p) => (
            <ResumeThumb key={p.id} project={p} />
          ))}
        </div>
        {projects.length === 0 ? (
          <p className="mt-3 text-xs text-slate-500">
            No resumes yet — use the dashed card to start in the studio, or create a saved project from{" "}
            <Link href={ROUTES.app.resumes} className="font-medium text-brand underline-offset-2 hover:underline">
              Resumes
            </Link>
            .
          </p>
        ) : null}
      </PanelChrome>

      <PanelChrome title="Templates" href={ROUTES.app.templates} icon={LayoutTemplate}>
        <Link
          href={ROUTES.app.templates}
          className="flex min-h-[10.5rem] flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/80 text-slate-600 transition-colors hover:border-slate-400 hover:bg-slate-100 hover:text-slate-900"
        >
          <Plus className="size-8 stroke-[1.25]" aria-hidden />
          <span className="mt-2 text-center text-xs font-semibold">Browse templates</span>
        </Link>
      </PanelChrome>
    </div>
  );
}

export function dashboardSidebarActive(pathname: string, href: string): boolean {
  if (href === ROUTES.app.root) {
    return pathname === ROUTES.app.root;
  }
  if (href === ROUTES.app.resumes) {
    return pathname === ROUTES.app.resumes || pathname.startsWith("/app/projects/");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Used by desktop sidebar and shared nav helpers. */
export const DASHBOARD_NAV_DESKTOP = [
  { href: ROUTES.app.root, label: "Dashboard", icon: LayoutDashboard },
  { href: ROUTES.app.resumes, label: "Resumes", icon: FileText },
  { href: ROUTES.app.templates, label: "Templates", icon: LayoutTemplate },
  { href: ROUTES.app.account, label: "Settings", icon: Settings },
] as const;

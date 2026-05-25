"use client";

import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  FileText,
  LayoutTemplate,
  Loader2,
  Plus,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import type { ComponentType, CSSProperties, SVGProps } from "react";

import { useAppLoginPanel } from "@/components/layout/app-login-panel";
import { ResumeAiScoreCard } from "@/components/resume-preview/resume-ai-score-card";
import {
  dashboardResumeStripFrameClass,
  ProjectResumePreviewCard,
} from "@/components/projects/project-resume-preview-card";
import { Button, buttonVariants } from "@/components/ui/button";
import { APP_NAME, ROUTES } from "@/lib/constants";
import { createProjectFormAction } from "@/services/projects/actions";
import type { DashboardProject } from "@/services/projects/queries";
import { cn } from "@/lib/utils";

type Props = {
  projects: DashboardProject[];
  firstName: string;
  isGuest: boolean;
};

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

type StatCardProps = {
  label: string;
  value: string | number;
  sub: string;
  href?: string;
  icon: IconType;
  iconClass: string;
};

function StatCard({ label, value, sub, href, icon: Icon, iconClass }: StatCardProps) {
  const body = (
    <>
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl",
          iconClass,
        )}
        aria-hidden
      >
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
        <div className="mt-0.5 flex items-baseline gap-2">
          <span className="text-2xl font-semibold tracking-tight text-slate-900">{value}</span>
          {href ? (
            <ArrowRight
              className="size-4 shrink-0 translate-x-0 text-slate-400 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100"
              aria-hidden
            />
          ) : null}
        </div>
        <p className="mt-0.5 text-xs text-slate-500">{sub}</p>
      </div>
    </>
  );

  const shellClass = cn(
    "group flex min-w-0 items-start gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-5",
    href
      ? "transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
      : "cursor-default hover:shadow-sm",
  );

  if (href) {
    return (
      <Link href={href} className={shellClass}>
        {body}
      </Link>
    );
  }

  return <div className={shellClass}>{body}</div>;
}

const dashboardCreateResumeClass = cn(
  dashboardResumeStripFrameClass,
  "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-100/90 p-4 text-slate-400 shadow-none transition-[color,background-color,border-color] duration-200",
  "hover:border-slate-400 hover:bg-slate-100 hover:text-slate-500",
  "outline-none focus-visible:ring-2 focus-visible:ring-slate-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
);

function CreateTile({ label, href }: { label: string; href: string }) {
  return (
    <Link href={href} className={dashboardCreateResumeClass}>
      <span className="text-center text-sm font-normal leading-snug">{label}</span>
      <Plus className="size-10 stroke-[1.35] text-slate-400" aria-hidden />
    </Link>
  );
}

/**
 * Submit button used inside <CreateProjectTile>.
 *
 * Lives in its own component so we can call `useFormStatus()` (which only reads pending state
 * when rendered as a descendant of a <form action={...}>). Mirrors the visual layout of
 * <CreateTile> but adds a busy state while the server action is creating the project.
 */
function CreateProjectTileSubmit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      aria-label={
        pending ? "Creating new resume" : "Create a new saved resume and open the studio"
      }
      className={cn(
        dashboardCreateResumeClass,
        "w-full bg-transparent",
        pending && "cursor-wait opacity-80",
      )}
    >
      <span className="text-center text-sm font-normal leading-snug">
        {pending ? "Creating…" : label}
      </span>
      {pending ? (
        <Loader2
          className="size-10 animate-spin stroke-[1.35] text-slate-400"
          aria-hidden
        />
      ) : (
        <Plus className="size-10 stroke-[1.35] text-slate-400" aria-hidden />
      )}
    </button>
  );
}

/**
 * Signed-in dashboard tile that creates a fresh `resume_projects` row via
 * `createProjectFormAction` and redirects to its build page — same flow as the sidebar
 * “New” button. No `templateSlug` field is posted, so the server seeds the draft empty.
 */
function CreateProjectTile({ label }: { label: string }) {
  return (
    <form action={createProjectFormAction} className="contents">
      <input type="hidden" name="title" value="Untitled resume" />
      <CreateProjectTileSubmit label={label} />
    </form>
  );
}

/**
 * Signed-in hero CTA pill — same visual as the previous `<Link>` but submits the same server
 * action as the sidebar "New" button (blank draft).
 */
function CreateNewResumeHeroButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      size="touch"
      className={cn(
        "rounded-full bg-[#2268d7] px-5 text-sm font-semibold text-white hover:bg-[#1a56b8]",
        pending && "cursor-wait opacity-90",
      )}
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" aria-hidden />
      ) : (
        <Plus className="size-4" aria-hidden />
      )}
      {pending ? "Creating…" : label}
    </Button>
  );
}

function CreateNewResumeHeroSubmit({ label }: { label: string }) {
  return (
    <form action={createProjectFormAction} className="contents">
      <input type="hidden" name="title" value="Untitled resume" />
      <CreateNewResumeHeroButton label={label} />
    </form>
  );
}

function RecentResumesRow({
  recentResumes,
  isGuest,
}: {
  recentResumes: DashboardProject[];
  isGuest: boolean;
}) {
  const shellRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [overflowing, setOverflowing] = useState(false);
  const resumeSig = useMemo(() => recentResumes.map((p) => p.id).join(","), [recentResumes]);

  useLayoutEffect(() => {
    if (isGuest || typeof ResizeObserver === "undefined") {
      setOverflowing(false);
      return;
    }

    const shellEl = shellRef.current;
    const measureEl = measureRef.current;
    if (!shellEl || !measureEl) return;

    function update() {
      const s = shellRef.current;
      const m = measureRef.current;
      if (!s || !m) return;
      if (recentResumes.length === 0) {
        setOverflowing(false);
        return;
      }
      setOverflowing(m.offsetWidth > s.clientWidth + 1);
    }

    update();
    const ro = new ResizeObserver(() => update());
    ro.observe(shellEl);
    ro.observe(measureEl);
    return () => ro.disconnect();
  }, [isGuest, resumeSig, recentResumes.length]);

  const resumeMarqueeDuration = `${Math.max(32, recentResumes.length * 5)}s`;

  if (isGuest) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:thin] sm:gap-4">
        <CreateTile label="Create new resume" href={ROUTES.create} />
      </div>
    );
  }

  return (
    <div ref={shellRef} className="relative w-full">
      <div
        ref={measureRef}
        className="pointer-events-none invisible absolute inset-x-0 top-0 -z-10 flex w-max gap-3 sm:gap-4"
        aria-hidden
      >
        <div className={dashboardCreateResumeClass} />
        {recentResumes.map((p) => (
          <div
            key={p.id}
            className={cn(dashboardResumeStripFrameClass, "shrink-0 rounded-sm bg-transparent")}
            aria-hidden
          />
        ))}
      </div>

      {overflowing ? (
        <div className="flex gap-3 sm:gap-4">
          <CreateProjectTile label="Create new resume" />
          <div
            className="dashboard-marquee-viewport relative min-h-0 min-w-0 flex-1"
            role="list"
            aria-label="Recent resume projects, scrolling"
          >
            <div
              className="flex w-max gap-3 animate-dashboard-resumes-marquee sm:gap-4"
              style={
                {
                  "--dashboard-marquee-duration": resumeMarqueeDuration,
                } as CSSProperties
              }
            >
              {[...recentResumes, ...recentResumes].map((p, i) => (
                <div key={`${p.id}-${i}`} className="shrink-0" role="listitem">
                  <ProjectResumePreviewCard project={p} strip />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:thin] sm:gap-4">
          <CreateProjectTile label="Create new resume" />
          {recentResumes.map((p) => (
            <ProjectResumePreviewCard key={p.id} project={p} strip />
          ))}
          {recentResumes.length === 0 ? (
            <div
              className={cn(
                dashboardResumeStripFrameClass,
                "flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-100/80 p-3 text-center text-xs text-slate-500",
              )}
            >
              No saved projects yet. Use Create new resume to begin.
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

export function DashboardHome({ projects, firstName, isGuest }: Props) {
  const { openLogin } = useAppLoginPanel();

  const recentResumes = projects;

  const today = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl space-y-6 sm:space-y-8">
      {/* Hero / welcome */}
      <section className="relative min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-sky-50/60 to-indigo-50/40 p-5 shadow-sm sm:p-7">
        <div className="absolute -right-16 -top-16 size-48 rounded-full bg-[#2268d7]/8 blur-2xl" aria-hidden />
        <div className="absolute -bottom-20 right-10 size-56 rounded-full bg-indigo-300/20 blur-3xl" aria-hidden />
        <div className="relative flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              <Calendar className="size-3.5 text-slate-400" aria-hidden />
              {today}
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              {isGuest ? "Welcome to your workspace" : `Welcome back, ${firstName}`}
            </h1>
            <p className="mt-1.5 max-w-xl text-sm text-slate-600 sm:text-base">
              {isGuest
                ? `Preview your ${APP_NAME} workspace. Build a polished resume in minutes — sign in to save projects across devices and export PDFs.`
                : "Continue your resumes, pick a template, preview your layout, and export when you are ready — that is where we are investing for launch."}
            </p>
            <div className="mt-4 flex flex-col items-stretch gap-2 min-[430px]:flex-row min-[430px]:flex-wrap sm:gap-3">
              {isGuest ? (
                <Link
                  href={ROUTES.create}
                  className={cn(
                    buttonVariants({ size: "touch" }),
                    "w-full rounded-full bg-[#2268d7] px-5 text-sm font-semibold text-white hover:bg-[#1a56b8] min-[430px]:w-auto",
                  )}
                >
                  <Plus className="size-4" aria-hidden />
                  {projects.length === 0 ? "Create your first resume" : "Create new resume"}
                </Link>
              ) : (
                <CreateNewResumeHeroSubmit
                  label={projects.length === 0 ? "Create your first resume" : "Create new resume"}
                />
              )}
              <Link
                href={ROUTES.app.templates}
                className={cn(
                  buttonVariants({ variant: "outline", size: "touch" }),
                  "w-full rounded-full border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 min-[430px]:w-auto",
                )}
              >
                <LayoutTemplate className="size-4" aria-hidden />
                Browse templates
              </Link>
              {isGuest ? (
                <Button
                  type="button"
                  onClick={() => openLogin(ROUTES.app.root)}
                  variant="ghost"
                  size="touch"
                  className="w-full rounded-full px-4 text-sm font-semibold text-[#2268d7] hover:bg-sky-100/50 hover:text-[#1a56b8] min-[430px]:w-auto"
                >
                  Sign in to sync
                  <ArrowRight className="size-4" aria-hidden />
                </Button>
              ) : null}
            </div>
          </div>
          <div className="hidden shrink-0 sm:block">
            <div className="relative grid size-32 place-items-center rounded-2xl bg-white/70 shadow-sm ring-1 ring-slate-200/80 backdrop-blur">
              <Sparkles className="size-10 text-[#2268d7]" aria-hidden />
              <div className="absolute -right-2 -top-2 size-6 rounded-full bg-amber-400 ring-4 ring-white" aria-hidden />
            </div>
          </div>
        </div>
      </section>

      {/* Stats row */}
      <section aria-label="Workspace stats" className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        <StatCard
          label="Resumes"
          value={projects.length}
          sub={projects.length === 0 ? "Start your first draft" : "Open Resumes"}
          href={ROUTES.app.resumes}
          icon={FileText}
          iconClass="bg-[#2268d7]/10 text-[#2268d7]"
        />
        <StatCard
          label="Templates"
          value="Browse"
          sub="Layouts for your projects"
          href={ROUTES.app.templates}
          icon={LayoutTemplate}
          iconClass="bg-violet-100 text-violet-800"
        />
        <StatCard
          label="Jobs & applications"
          value="—"
          sub="On the roadmap after resume export"
          icon={Sparkles}
          iconClass="bg-slate-100 text-slate-600"
        />
      </section>

      {!isGuest && recentResumes[0] ? (
        <ResumeAiScoreCard
          variant="dashboard"
          projectId={recentResumes[0].id}
          resumeTitle={recentResumes[0].title}
        />
      ) : null}

      {/* Recent resumes */}
      <section
        aria-labelledby="recent-resumes-heading"
        className="min-w-0 overflow-x-clip rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-6"
      >
        <div className="mb-4 flex min-w-0 items-center justify-between gap-3">
          <div className="min-w-0">
            <h2
              id="recent-resumes-heading"
              className="text-base font-semibold tracking-tight text-slate-900 sm:text-lg"
            >
              Recent resumes
            </h2>
            <p className="text-xs text-slate-500 sm:text-sm">
              {projects.length === 0
                ? isGuest
                  ? "Try the studio — your draft stays in this browser until you sign in."
                  : "Start your first resume. You can pick a template and customize later."
                : `You have ${projects.length} saved ${projects.length === 1 ? "project" : "projects"}.`}
            </p>
          </div>
          <Link
            href={ROUTES.app.resumes}
            className="inline-flex min-h-11 min-w-[2.75rem] items-center justify-center gap-1 rounded-full px-3 py-2 text-xs font-semibold text-[#2268d7] transition-colors hover:bg-sky-50 hover:text-[#1a56b8] sm:min-h-0 sm:text-sm"
          >
            View all
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
        <RecentResumesRow recentResumes={recentResumes} isGuest={isGuest} />
      </section>

      <section
        aria-label="Product roadmap"
        className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6"
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <Sparkles className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
                Job search &amp; application tracking
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                Not part of this release. There is no live job feed or application database behind the
                dashboard yet — we are prioritizing resume editing, preview, checkout, and PDF export so
                what you ship to employers is trustworthy first.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Link
              href={ROUTES.app.resumes}
              className={cn(
                buttonVariants({ variant: "default", size: "touch" }),
                "rounded-full bg-[#2268d7] px-5 text-sm font-semibold text-white hover:bg-[#1a56b8]",
              )}
            >
              Go to resumes
            </Link>
            <Link
              href={ROUTES.create}
              className={cn(
                buttonVariants({ variant: "outline", size: "touch" }),
                "rounded-full border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50",
              )}
            >
              Resume builder
            </Link>
          </div>
        </div>
      </section>

      {/* Getting started / guest CTA */}
      {isGuest ? (
        <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#2268d7]/10 text-[#2268d7]">
                <CheckCircle2 className="size-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <h2 className="text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
                  Sign in to unlock the full workspace
                </h2>
                <p className="mt-0.5 text-sm text-slate-600">
                  Save resume projects to your account, export PDFs, and sync across devices. Your draft on{" "}
                  <Link href={ROUTES.create} className="font-medium text-[#2268d7] underline-offset-2 hover:underline">
                    Create
                  </Link>{" "}
                  stays in this browser until then.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button
                type="button"
                onClick={() => openLogin(ROUTES.app.root)}
                size="touch"
                className="rounded-full bg-[#2268d7] px-5 text-sm font-semibold text-white hover:bg-[#1a56b8]"
              >
                Sign in
              </Button>
              <Link
                href={ROUTES.create}
                className={cn(
                  buttonVariants({ variant: "outline", size: "touch" }),
                  "rounded-full border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50",
                )}
              >
                Continue as guest
              </Link>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}

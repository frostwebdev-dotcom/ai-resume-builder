"use client";

import {
  ArrowRight,
  Briefcase,
  Calendar,
  CheckCircle2,
  ClipboardList,
  FileText,
  ListTodo,
  MapPin,
  Plus,
  Sparkles,
  Star,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import type { ComponentType, SVGProps } from "react";

import { useAppLoginPanel } from "@/components/layout/app-login-panel";
import { Button, buttonVariants } from "@/components/ui/button";
import { DEMO_APPLICATIONS, type ApplicationStatus } from "@/lib/applications/demo-applications";
import { APP_NAME, ROUTES } from "@/lib/constants";
import { DEMO_JOB_LISTINGS } from "@/lib/jobs/demo-listings";
import { templateIdToSlug } from "@/lib/resume-preview/resolve-slug";
import { getTemplateTheme } from "@/lib/resume-preview/template-theme";
import type { DashboardProject } from "@/services/projects/queries";
import { cn } from "@/lib/utils";

type Props = {
  projects: DashboardProject[];
  firstName: string;
  isGuest: boolean;
};

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

function statusBadgeClass(status: ApplicationStatus) {
  switch (status) {
    case "Applied":
      return "bg-slate-100 text-slate-700";
    case "Phone screen":
      return "bg-sky-100 text-sky-800";
    case "Interview":
      return "bg-violet-100 text-violet-900";
    case "Offer":
      return "bg-emerald-100 text-emerald-900";
    case "Rejected":
      return "bg-red-100 text-red-800";
    case "Withdrawn":
      return "bg-slate-100 text-slate-500";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

type StatCardProps = {
  label: string;
  value: string | number;
  sub: string;
  href: string;
  icon: IconType;
  iconClass: string;
};

function StatCard({ label, value, sub, href, icon: Icon, iconClass }: StatCardProps) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md sm:p-5"
    >
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
          <ArrowRight
            className="size-4 shrink-0 translate-x-0 text-slate-400 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100"
            aria-hidden
          />
        </div>
        <p className="mt-0.5 text-xs text-slate-500">{sub}</p>
      </div>
    </Link>
  );
}

function ResumeTile({ project }: { project: DashboardProject }) {
  const slug = templateIdToSlug(project.templateId);
  const theme = getTemplateTheme(slug);
  const href = project.isArchived
    ? ROUTES.app.project(project.id)
    : ROUTES.app.projectBuild(project.id);

  return (
    <Link
      href={href}
      className="group/thumb relative flex w-[10.5rem] shrink-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md sm:w-[11.5rem]"
    >
      <div className="relative h-[7rem] bg-slate-50">
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
      <div className="border-t border-slate-100 p-2.5">
        <p className="line-clamp-2 text-xs font-semibold leading-snug text-slate-900">{project.title}</p>
        <p className="mt-0.5 text-[0.65rem] text-slate-500">Edited {formatEdited(project.updatedAt)}</p>
      </div>
    </Link>
  );
}

function CreateTile({ label, href }: { label: string; href: string }) {
  return (
    <Link
      href={href}
      className="group flex h-[10.5rem] w-[10.5rem] shrink-0 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#2268d7]/40 bg-sky-50/40 p-3 text-[#2268d7] transition-colors hover:border-[#2268d7] hover:bg-sky-50/80 hover:text-[#1a56b8] sm:h-[11.5rem] sm:w-[11.5rem]"
    >
      <span className="flex size-10 items-center justify-center rounded-full bg-white/80 ring-1 ring-[#2268d7]/20 transition-transform group-hover:scale-105">
        <Plus className="size-5" aria-hidden />
      </span>
      <span className="text-center text-xs font-semibold leading-snug">{label}</span>
    </Link>
  );
}

export function DashboardHome({ projects, firstName, isGuest }: Props) {
  const { openLogin } = useAppLoginPanel();

  const recent = projects.slice(0, 6);

  const activeApplications = isGuest
    ? 0
    : DEMO_APPLICATIONS.filter((a) => !["Rejected", "Withdrawn"].includes(a.status)).length;
  const interviewCount = isGuest
    ? 0
    : DEMO_APPLICATIONS.filter((a) => a.status === "Interview" || a.status === "Phone screen").length;
  const savedJobsCount = isGuest ? 0 : 4;

  const upcomingPipeline = DEMO_APPLICATIONS.filter(
    (a) => !["Rejected", "Withdrawn"].includes(a.status),
  ).slice(0, 4);
  const suggestedJobs = DEMO_JOB_LISTINGS.slice(0, 4);

  const today = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 sm:space-y-8">
      {/* Hero / welcome */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-sky-50/60 to-indigo-50/40 p-5 shadow-sm sm:p-7">
        <div className="absolute -right-16 -top-16 size-48 rounded-full bg-[#2268d7]/8 blur-2xl" aria-hidden />
        <div className="absolute -bottom-20 right-10 size-56 rounded-full bg-indigo-300/20 blur-3xl" aria-hidden />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
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
                ? `Preview your ${APP_NAME} workspace. Build a polished resume in minutes — sign in to sync projects, save jobs, and track applications.`
                : "Pick up where you left off, review interviews coming up, and keep your application pipeline moving."}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2 sm:gap-3">
              <Link
                href={ROUTES.create}
                className={cn(
                  buttonVariants({ size: "default" }),
                  "h-10 rounded-full bg-[#2268d7] px-5 text-sm font-semibold text-white hover:bg-[#1a56b8]",
                )}
              >
                <Plus className="size-4" aria-hidden />
                {projects.length === 0 ? "Create your first resume" : "Create new resume"}
              </Link>
              <Link
                href={ROUTES.app.jobs}
                className={cn(
                  buttonVariants({ variant: "outline", size: "default" }),
                  "h-10 rounded-full border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50",
                )}
              >
                <Briefcase className="size-4" aria-hidden />
                Browse jobs
              </Link>
              {isGuest ? (
                <Button
                  type="button"
                  onClick={() => openLogin(ROUTES.app.root)}
                  variant="ghost"
                  className="h-10 rounded-full px-4 text-sm font-semibold text-[#2268d7] hover:bg-sky-100/50 hover:text-[#1a56b8]"
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
      <section aria-label="Workspace stats" className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Resumes"
          value={projects.length}
          sub={projects.length === 0 ? "Start your first draft" : "Open Resumes"}
          href={ROUTES.app.resumes}
          icon={FileText}
          iconClass="bg-[#2268d7]/10 text-[#2268d7]"
        />
        <StatCard
          label="Saved jobs"
          value={savedJobsCount}
          sub={isGuest ? "Sign in to track" : "Browse listings"}
          href={ROUTES.app.jobs}
          icon={Briefcase}
          iconClass="bg-amber-100 text-amber-700"
        />
        <StatCard
          label="Applications"
          value={activeApplications}
          sub={isGuest ? "Sign in to track" : "Active in pipeline"}
          href={ROUTES.app.applications}
          icon={ClipboardList}
          iconClass="bg-emerald-100 text-emerald-700"
        />
        <StatCard
          label="Interviews"
          value={interviewCount}
          sub={isGuest ? "Sign in to track" : "Scheduled this week"}
          href={ROUTES.app.applications}
          icon={TrendingUp}
          iconClass="bg-violet-100 text-violet-700"
        />
      </section>

      {/* Recent resumes */}
      <section
        aria-labelledby="recent-resumes-heading"
        className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
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
            className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-[#2268d7] transition-colors hover:bg-sky-50 hover:text-[#1a56b8] sm:text-sm"
          >
            View all
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:thin] sm:gap-4">
          <CreateTile label="Create new resume" href={ROUTES.create} />
          {recent.map((p) => (
            <ResumeTile key={p.id} project={p} />
          ))}
          {recent.length === 0 && !isGuest ? (
            <div className="flex w-[11.5rem] shrink-0 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-3 text-center text-xs text-slate-500">
              No saved projects yet. Use the blue card to begin.
            </div>
          ) : null}
        </div>
      </section>

      {/* Two column: pipeline + jobs */}
      <section className="grid gap-4 lg:grid-cols-2 lg:gap-5">
        {/* Pipeline / next steps */}
        <article className="flex flex-col rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <ClipboardList className="size-4.5" aria-hidden />
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
                  Application pipeline
                </h2>
                <p className="truncate text-xs text-slate-500 sm:text-sm">
                  {isGuest ? "Sample pipeline — sign in to track yours." : "Next steps for active applications."}
                </p>
              </div>
            </div>
            <Link
              href={ROUTES.app.applications}
              className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-[#2268d7] transition-colors hover:bg-sky-50 hover:text-[#1a56b8] sm:text-sm"
            >
              Track
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>

          <ul className="space-y-2.5">
            {upcomingPipeline.map((a) => (
              <li
                key={a.id}
                className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/40 p-3 transition-colors hover:border-slate-200 hover:bg-white sm:p-3.5"
              >
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                    a.logo.className,
                  )}
                  aria-hidden
                >
                  {a.logo.letter}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-slate-900">{a.company}</p>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold",
                        statusBadgeClass(a.status),
                      )}
                    >
                      {a.status}
                    </span>
                  </div>
                  <p className="truncate text-xs text-slate-600">{a.roleTitle}</p>
                  {a.nextStep ? (
                    <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-slate-500">
                      <ListTodo className="size-3.5 shrink-0 text-slate-400" aria-hidden />
                      {a.nextStep}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </article>

        {/* Suggested jobs */}
        <article className="flex flex-col rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <Star className="size-4.5" aria-hidden />
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
                  Suggested jobs
                </h2>
                <p className="truncate text-xs text-slate-500 sm:text-sm">
                  Fresh listings near you — tailor a resume per role.
                </p>
              </div>
            </div>
            <Link
              href={ROUTES.app.jobs}
              className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-[#2268d7] transition-colors hover:bg-sky-50 hover:text-[#1a56b8] sm:text-sm"
            >
              Browse
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>

          <ul className="space-y-2.5">
            {suggestedJobs.map((j) => (
              <li
                key={j.id}
                className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/40 p-3 transition-colors hover:border-slate-200 hover:bg-white sm:p-3.5"
              >
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                    j.logo.className,
                  )}
                  aria-hidden
                >
                  {j.logo.letter}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{j.title}</p>
                  <p className="truncate text-xs text-slate-600">{j.company}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.7rem] text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-3 text-slate-400" aria-hidden />
                      {j.locationLabel}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Briefcase className="size-3 text-slate-400" aria-hidden />
                      {j.employmentType}
                    </span>
                    {j.salaryLabel ? (
                      <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                        {j.salaryLabel}
                      </span>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </article>
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
                  Save unlimited resume versions, track applications, and sync across devices. Your draft on{" "}
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
                className="h-10 rounded-full bg-[#2268d7] px-5 text-sm font-semibold text-white hover:bg-[#1a56b8]"
              >
                Sign in
              </Button>
              <Link
                href={ROUTES.create}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-10 rounded-full border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50",
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

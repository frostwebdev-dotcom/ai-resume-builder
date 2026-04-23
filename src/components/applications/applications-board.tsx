"use client";

import { Building2, Calendar, ChevronDown, ListTodo } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { useAppLoginPanel } from "@/components/layout/app-login-panel";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  APPLICATION_STATUS_OPTIONS,
  DEMO_APPLICATIONS,
  type ApplicationStatus,
  type DemoApplication,
} from "@/lib/applications/demo-applications";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Props = {
  guest?: boolean;
};

type StatusFilter = "all" | ApplicationStatus;

function statusBadgeClass(status: ApplicationStatus) {
  switch (status) {
    case "Applied":
      return "border-slate-200 bg-slate-50 text-slate-700";
    case "Phone screen":
      return "border-sky-200 bg-sky-50 text-sky-800";
    case "Interview":
      return "border-violet-200 bg-violet-50 text-violet-900";
    case "Offer":
      return "border-emerald-200 bg-emerald-50 text-emerald-900";
    case "Rejected":
      return "border-red-200 bg-red-50 text-red-800";
    case "Withdrawn":
      return "border-slate-200 bg-white text-slate-500";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function matchesQuery(row: DemoApplication, q: string) {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  return (
    row.company.toLowerCase().includes(s) ||
    row.roleTitle.toLowerCase().includes(s) ||
    row.nextStep.toLowerCase().includes(s)
  );
}

export function ApplicationsBoard({ guest = false }: Props) {
  const { openLogin } = useAppLoginPanel();
  const [queryDraft, setQueryDraft] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const rows = useMemo(() => {
    return DEMO_APPLICATIONS.filter(
      (r) => matchesQuery(r, query) && (statusFilter === "all" || r.status === statusFilter),
    );
  }, [query, statusFilter]);

  function runSearch(e: React.FormEvent) {
    e.preventDefault();
    setQuery(queryDraft);
  }

  const statusFilterLabel = statusFilter === "all" ? "All statuses" : statusFilter;

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-slate-100">
      <div className="min-h-0 flex-1 basis-0 overflow-y-auto overflow-x-hidden overscroll-y-auto pb-10 pt-6 sm:pb-12 sm:pt-8">
        <PageContainer>
        {guest ? (
          <div className="mb-6 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm sm:px-5">
            <span className="text-slate-700">
              You&apos;re browsing as a guest. Application history will sync here after you sign in. Explore the sample
              pipeline below.
            </span>{" "}
            <button
              type="button"
              onClick={() => openLogin(ROUTES.app.applications)}
              className="font-semibold text-[#2268d7] underline-offset-2 hover:underline"
            >
              Sign in
            </button>
            {" · "}
            <Link className="font-medium text-[#2268d7] underline-offset-2 hover:underline" href={ROUTES.app.jobs}>
              Browse jobs
            </Link>
            {" · "}
            <Link className="font-medium text-[#2268d7] underline-offset-2 hover:underline" href={ROUTES.app.resumes}>
              Resumes
            </Link>
          </div>
        ) : null}

        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Applications</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-600">
          Track where you applied, follow-ups, and outcomes. This preview uses sample data until tracking is connected to
          your account.
        </p>

        <form
          onSubmit={runSearch}
          className="mt-6 flex flex-col gap-4 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm sm:flex-row sm:items-end sm:gap-3 sm:p-5"
        >
          <div className="min-w-0 flex-1">
            <Field id="applications-search" label="Search applications">
              <Input
                name="q"
                placeholder="Company or role"
                value={queryDraft}
                onChange={(e) => setQueryDraft(e.target.value)}
                autoComplete="off"
              />
            </Field>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              type="button"
              className={cn(
                "inline-flex h-11 w-full shrink-0 items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-3 text-sm font-medium text-slate-700 outline-none transition-colors sm:h-9 sm:w-[13rem]",
                "hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-[#2268d7]/40 data-popup-open:bg-slate-100",
              )}
            >
              <span className="flex min-w-0 items-center gap-2">
                <ListTodo className="size-4 shrink-0 text-slate-500" aria-hidden />
                <span className="truncate">{statusFilterLabel}</span>
              </span>
              <ChevronDown className="size-4 shrink-0 text-slate-400" aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[13rem]">
              <DropdownMenuItem onSelect={() => setStatusFilter("all")}>All statuses</DropdownMenuItem>
              {APPLICATION_STATUS_OPTIONS.map((s) => (
                <DropdownMenuItem key={s} onSelect={() => setStatusFilter(s)}>
                  {s}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            type="submit"
            className="h-11 w-full shrink-0 rounded-full bg-[#2268d7] text-white hover:bg-[#1a56b8] sm:h-9 sm:w-auto sm:min-w-[7.5rem] sm:rounded-full"
          >
            Search
          </Button>
        </form>

        <ul className="mt-6 space-y-3 sm:space-y-4">
          {rows.map((row) => (
            <li key={row.id}>
              <article
                className={cn(
                  "rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm transition-shadow sm:p-5",
                  "hover:border-slate-300 hover:shadow-md",
                )}
              >
                <div className="flex gap-4">
                  <div
                    className={cn(
                      "flex size-12 shrink-0 items-center justify-center rounded-lg text-sm font-bold sm:size-14 sm:text-base",
                      row.logo.className,
                    )}
                    aria-hidden
                  >
                    {row.logo.letter}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                      <div className="min-w-0">
                        <h2 className="text-base font-semibold leading-snug text-slate-900 sm:text-lg">
                          {row.roleTitle}
                        </h2>
                        <p className="mt-0.5 inline-flex items-center gap-1.5 text-sm text-slate-600">
                          <Building2 className="size-3.5 shrink-0 text-slate-400" aria-hidden />
                          {row.company}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "inline-flex w-fit shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold sm:text-sm",
                          statusBadgeClass(row.status),
                        )}
                      >
                        {row.status}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-col gap-2 text-xs text-slate-600 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5 sm:gap-y-1 sm:text-sm">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="size-3.5 shrink-0 text-slate-400 sm:size-4" aria-hidden />
                        Applied {row.appliedLabel}
                      </span>
                      {row.nextStep ? (
                        <span className="inline-flex items-start gap-1.5 sm:max-w-[70%]">
                          <ListTodo className="mt-0.5 size-3.5 shrink-0 text-slate-400 sm:size-4" aria-hidden />
                          <span>{row.nextStep}</span>
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ul>

        {rows.length === 0 ? (
          <p className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white/60 px-4 py-8 text-center text-sm text-slate-600">
            No sample applications match.{" "}
            <button
              type="button"
              className="font-medium text-[#2268d7] underline-offset-2 hover:underline"
              onClick={() => {
                setQueryDraft("");
                setQuery("");
                setStatusFilter("all");
              }}
            >
              Clear search and filters
            </button>
            .
          </p>
        ) : null}
        </PageContainer>
      </div>
    </section>
  );
}

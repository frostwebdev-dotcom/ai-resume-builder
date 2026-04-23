"use client";

import {
  Banknote,
  Briefcase,
  ChevronDown,
  Clock,
  Globe,
  MapPin,
  Star,
} from "lucide-react";
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
import { ROUTES } from "@/lib/constants";
import { DEMO_JOB_LISTINGS, type DemoJobListing } from "@/lib/jobs/demo-listings";
import { cn } from "@/lib/utils";

const RADIUS_OPTIONS = ["5 mi.", "10 mi.", "15 mi.", "25 mi.", "50 mi."] as const;
const REGION_OPTIONS = ["United States", "Remote only", "Worldwide"] as const;

type Props = {
  guest?: boolean;
};

function matchesSearch(job: DemoJobListing, position: string, location: string) {
  const p = position.trim().toLowerCase();
  const l = location.trim().toLowerCase();
  const posOk =
    !p ||
    job.title.toLowerCase().includes(p) ||
    job.company.toLowerCase().includes(p) ||
    job.snippet.toLowerCase().includes(p);
  const locOk =
    !l ||
    job.locationLabel.toLowerCase().includes(l) ||
    l.split(/\s+/).every((word) => word.length < 2 || job.locationLabel.toLowerCase().includes(word));
  return posOk && locOk;
}

export function JobsBoard({ guest = false }: Props) {
  const { openLogin } = useAppLoginPanel();
  const [positionDraft, setPositionDraft] = useState("");
  const [locationDraft, setLocationDraft] = useState("Seattle");
  const [positionQuery, setPositionQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("Seattle");
  const [radius, setRadius] = useState<(typeof RADIUS_OPTIONS)[number]>("15 mi.");
  const [region, setRegion] = useState<(typeof REGION_OPTIONS)[number]>("United States");
  const [saved, setSaved] = useState<Set<string>>(() => new Set());

  const results = useMemo(
    () => DEMO_JOB_LISTINGS.filter((j) => matchesSearch(j, positionQuery, locationQuery)),
    [positionQuery, locationQuery],
  );

  function runSearch(e: React.FormEvent) {
    e.preventDefault();
    setPositionQuery(positionDraft);
    setLocationQuery(locationDraft);
  }

  function toggleSaved(id: string) {
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <section className="min-h-0 flex-1 bg-slate-100 pb-10 pt-6 sm:pb-12 sm:pt-8">
      <PageContainer>
        {guest ? (
          <div className="mb-6 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm sm:px-5">
            <span className="text-slate-700">
              You&apos;re browsing as a guest. Saved jobs and alerts will sync after you sign in. Try the search below
              with sample listings.
            </span>{" "}
            <button
              type="button"
              onClick={() => openLogin(ROUTES.app.jobs)}
              className="font-semibold text-[#2268d7] underline-offset-2 hover:underline"
            >
              Sign in
            </button>
            {" · "}
            <Link className="font-medium text-[#2268d7] underline-offset-2 hover:underline" href={ROUTES.create}>
              Create a resume
            </Link>
          </div>
        ) : null}

        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Jobs</h1>

        <form
          onSubmit={runSearch}
          className="mt-6 flex flex-col gap-4 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5"
        >
          <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <Field id="jobs-position" label="Desired job position">
              <Input
                name="position"
                placeholder="e.g. Product manager"
                value={positionDraft}
                onChange={(e) => setPositionDraft(e.target.value)}
                autoComplete="off"
              />
            </Field>
            <Field id="jobs-location" label="Location">
              <Input
                name="location"
                placeholder="City, state, or remote"
                value={locationDraft}
                onChange={(e) => setLocationDraft(e.target.value)}
                autoComplete="off"
              />
            </Field>
            <Button
              type="submit"
              className="h-11 w-full shrink-0 rounded-full bg-[#2268d7] text-white hover:bg-[#1a56b8] sm:h-9 sm:w-auto sm:min-w-[7.5rem] sm:rounded-full"
            >
              Search
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4 sm:gap-4">
            <span className="sr-only">Search filters</span>
            <DropdownMenu>
              <DropdownMenuTrigger
                type="button"
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50/80 px-3 text-sm font-medium text-slate-700 outline-none transition-colors",
                  "hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-[#2268d7]/40 data-popup-open:bg-slate-100",
                )}
              >
                <MapPin className="size-4 shrink-0 text-slate-500" aria-hidden />
                {radius}
                <ChevronDown className="size-4 shrink-0 text-slate-400" aria-hidden />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[9rem]">
                {RADIUS_OPTIONS.map((opt) => (
                  <DropdownMenuItem key={opt} onSelect={() => setRadius(opt)}>
                    {opt}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger
                type="button"
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50/80 px-3 text-sm font-medium text-slate-700 outline-none transition-colors",
                  "hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-[#2268d7]/40 data-popup-open:bg-slate-100",
                )}
              >
                <Globe className="size-4 shrink-0 text-slate-500" aria-hidden />
                {region}
                <ChevronDown className="size-4 shrink-0 text-slate-400" aria-hidden />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[11rem]">
                {REGION_OPTIONS.map((opt) => (
                  <DropdownMenuItem key={opt} onSelect={() => setRegion(opt)}>
                    {opt}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </form>

        <p className="mt-4 text-xs text-slate-500">
          Sample listings for layout preview — job search integrations can plug in here later.
        </p>

        <ul className="mt-6 space-y-3 sm:space-y-4">
          {results.map((job) => (
            <li key={job.id}>
              <article
                className={cn(
                  "relative rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm transition-shadow sm:p-5",
                  "hover:border-slate-300 hover:shadow-md",
                )}
              >
                <button
                  type="button"
                  onClick={() => toggleSaved(job.id)}
                  className="absolute right-3 top-3 rounded-md p-1.5 text-slate-400 outline-none transition-colors hover:bg-slate-100 hover:text-amber-500 focus-visible:ring-2 focus-visible:ring-[#2268d7]/40 sm:right-4 sm:top-4"
                  aria-label={saved.has(job.id) ? "Remove from saved" : "Save job"}
                  aria-pressed={saved.has(job.id)}
                >
                  <Star
                    className={cn("size-5", saved.has(job.id) && "fill-amber-400 text-amber-500")}
                    strokeWidth={saved.has(job.id) ? 0 : 1.75}
                  />
                </button>

                <div className="flex gap-4 pr-10">
                  <div
                    className={cn(
                      "flex size-12 shrink-0 items-center justify-center rounded-lg text-sm font-bold sm:size-14 sm:text-base",
                      job.logo.className,
                    )}
                    aria-hidden
                  >
                    {job.logo.letter}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-semibold leading-snug text-slate-900 sm:text-lg">{job.title}</h2>
                    <p className="mt-0.5 text-sm text-slate-600">{job.company}</p>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600">{job.snippet}</p>

                    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-600 sm:text-sm">
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="size-3.5 shrink-0 text-slate-400 sm:size-4" aria-hidden />
                        {job.locationLabel}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Briefcase className="size-3.5 shrink-0 text-slate-400 sm:size-4" aria-hidden />
                        {job.employmentType}
                      </span>
                      {job.salaryLabel ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Banknote className="size-3.5 shrink-0 text-slate-400 sm:size-4" aria-hidden />
                          {job.salaryLabel}
                        </span>
                      ) : null}
                      <span className="ml-auto inline-flex items-center gap-1.5 text-slate-500">
                        <Clock className="size-3.5 shrink-0 sm:size-4" aria-hidden />
                        {job.postedLabel}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ul>

        {results.length === 0 ? (
          <p className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white/60 px-4 py-8 text-center text-sm text-slate-600">
            No sample listings match that search. Clear keywords or try{" "}
            <button
              type="button"
              className="font-medium text-[#2268d7] underline-offset-2 hover:underline"
              onClick={() => {
                setPositionDraft("");
                setLocationDraft("Seattle");
                setPositionQuery("");
                setLocationQuery("Seattle");
              }}
            >
              reset filters
            </button>
            .
          </p>
        ) : null}
      </PageContainer>
    </section>
  );
}

"use client";

import { useMemo, useState } from "react";
import { Filter, Search, SearchX } from "lucide-react";

import type { DashboardProject } from "@/services/projects/queries";
import { ProjectCard } from "@/components/projects/project-card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = {
  projects: DashboardProject[];
};

type Filter = "all" | "active" | "archived" | "ready" | "paid";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "ready", label: "Ready" },
  { id: "paid", label: "Paid" },
  { id: "archived", label: "Archived" },
];

/**
 * Client-side list: search + quick filters. Works against the already-fetched
 * dashboard payload so there's zero network on keystroke.
 */
export function ProjectsList({ projects }: Props) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter((p) => {
      if (filter === "archived" && !p.isArchived) return false;
      if (filter === "active" && p.isArchived) return false;
      if (filter === "ready") {
        if (p.isArchived) return false;
        if (
          p.displayStatus !== "ready_for_preview" &&
          p.displayStatus !== "paid" &&
          p.displayStatus !== "downloaded"
        )
          return false;
      }
      if (filter === "paid") {
        if (p.displayStatus !== "paid" && p.displayStatus !== "downloaded")
          return false;
      }
      if (!q) return true;
      return p.title.toLowerCase().includes(q);
    });
  }, [projects, query, filter]);

  const showSearch = projects.length >= 4;

  return (
    <section className="space-y-3" aria-labelledby="projects-list-heading">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 id="projects-list-heading" className="text-subhead text-foreground">
            Projects
          </h2>
          <p className="text-caption text-muted-foreground">
            {filtered.length} of {projects.length} shown
          </p>
        </div>

        {showSearch ? (
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search resumes…"
              aria-label="Search resumes"
              className="w-full min-w-[14rem] pl-9 sm:w-72"
            />
          </div>
        ) : null}
      </div>

      {projects.length > 1 ? (
        <div
          role="tablist"
          aria-label="Filter projects"
          className="flex flex-wrap items-center gap-1"
        >
          <Filter className="mr-1 size-3.5 text-muted-foreground" aria-hidden />
          {FILTERS.map((f) => {
            const active = f.id === filter;
            return (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(f.id)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-semibold transition-colors",
                  active
                    ? "bg-brand text-brand-foreground ring-1 ring-brand"
                    : "bg-muted/60 text-muted-foreground ring-1 ring-border hover:text-foreground",
                )}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/80 bg-muted/20 px-6 py-10 text-center"
          role="status"
        >
          <SearchX className="size-6 text-muted-foreground" aria-hidden />
          <p className="text-sm font-medium text-foreground">No matches</p>
          <p className="text-caption text-muted-foreground">
            Try a different keyword or clear the filter.
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <li key={p.id}>
              <ProjectCard project={p} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

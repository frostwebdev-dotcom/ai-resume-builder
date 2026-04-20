"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";

import { createProjectAction } from "@/services/projects/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Single-row, dashboard-first create form. Small footprint so users can see
 * stats + existing projects on the same screen.
 */
export function DashboardQuickCreate() {
  const [state, action, pending] = useActionState(createProjectAction, {});

  return (
    <form
      action={action}
      className="flex w-full flex-col gap-2 sm:flex-row sm:items-end"
    >
      <div className="min-w-0 flex-1">
        <Label
          htmlFor="dash-new-project-title"
          className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
        >
          New resume name
        </Label>
        <Input
          id="dash-new-project-title"
          name="title"
          type="text"
          placeholder="e.g. Product designer — 2026"
          autoComplete="off"
          maxLength={120}
          required
          disabled={pending}
          aria-describedby={state.error ? "dash-new-project-error" : undefined}
          aria-invalid={state.error ? true : undefined}
          className="mt-1.5"
        />
      </div>
      <Button
        type="submit"
        size="touch"
        disabled={pending}
        className="w-full shrink-0 gap-1.5 sm:h-11 sm:w-auto sm:min-w-[10rem]"
      >
        <Plus className="size-4" aria-hidden />
        {pending ? "Creating…" : "Create resume"}
      </Button>
      {state.error ? (
        <p
          id="dash-new-project-error"
          className="text-sm font-medium text-destructive sm:absolute sm:bottom-[-1.3rem]"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}
    </form>
  );
}

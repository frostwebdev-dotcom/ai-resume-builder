"use client";

import { useActionState } from "react";

import { createProjectAction } from "@/services/projects/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateProjectForm() {
  const [state, action, pending] = useActionState(createProjectAction, {});

  return (
    <form action={action} className="flex w-full flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1 space-y-2">
          <Label htmlFor="new-project-title">New resume name</Label>
          <Input
            id="new-project-title"
            name="title"
            type="text"
            placeholder="e.g. Product designer — 2026"
            autoComplete="off"
            maxLength={120}
            required
            disabled={pending}
            className="min-h-11"
          />
        </div>
        <Button
          type="submit"
          size="touch"
          disabled={pending}
          className="w-full shrink-0 sm:w-auto sm:min-w-[10rem]"
        >
          {pending ? "Creating…" : "Create resume"}
        </Button>
      </div>
      {state.error ? (
        <Alert variant="destructive">
          <AlertTitle>Could not create</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
    </form>
  );
}

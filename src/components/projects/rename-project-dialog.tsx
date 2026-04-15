"use client";

import { useActionState, useEffect } from "react";

import { renameProjectAction, type ProjectActionState } from "@/services/projects/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type RenameProjectDialogProps = {
  projectId: string;
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function RenameProjectDialog({
  projectId,
  title,
  open,
  onOpenChange,
}: RenameProjectDialogProps) {
  const [state, action, pending] = useActionState(
    renameProjectAction,
    {} as ProjectActionState,
  );

  useEffect(() => {
    if (state.success) onOpenChange(false);
  }, [state.success, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton>
        <DialogHeader>
          <DialogTitle>Rename resume</DialogTitle>
          <DialogDescription>
            This only changes the name shown in your list. Links stay the same.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="grid gap-4">
          <input type="hidden" name="projectId" value={projectId} />
          <div className="space-y-2">
            <Label htmlFor={`rename-${projectId}`}>Name</Label>
            <Input
              id={`rename-${projectId}`}
              name="title"
              key={open ? "open" : "closed"}
              defaultValue={title}
              maxLength={120}
              required
              disabled={pending}
              autoComplete="off"
            />
          </div>
          {state.error ? (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

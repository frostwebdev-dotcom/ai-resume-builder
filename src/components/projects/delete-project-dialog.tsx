"use client";

import { useActionState } from "react";

import { deleteProjectAction, type ProjectActionState } from "@/services/projects/actions";
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

type DeleteProjectDialogProps = {
  projectId: string;
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DeleteProjectDialog({
  projectId,
  title,
  open,
  onOpenChange,
}: DeleteProjectDialogProps) {
  const [state, action, pending] = useActionState(
    deleteProjectAction,
    {} as ProjectActionState,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton>
        <DialogHeader>
          <DialogTitle>Delete this resume?</DialogTitle>
          <DialogDescription>
            {`"${title}" will be removed from your dashboard. You can contact support if you need recovery.`}
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <input type="hidden" name="projectId" value={projectId} />
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
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

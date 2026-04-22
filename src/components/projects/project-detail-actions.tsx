"use client";

import { useState, useTransition } from "react";
import { Copy, Pencil, Trash2 } from "lucide-react";

import type { ProjectDetail } from "@/services/projects/queries";
import { duplicateProjectAction } from "@/services/projects/actions";
import { DeleteProjectDialog } from "@/components/projects/delete-project-dialog";
import { RenameProjectDialog } from "@/components/projects/rename-project-dialog";
import { Button } from "@/components/ui/button";

type ProjectDetailActionsProps = {
  detail: ProjectDetail;
};

export function ProjectDetailActions({ detail }: ProjectDetailActionsProps) {
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [dupPending, startDup] = useTransition();

  const { project } = detail;

  function runDuplicate() {
    const fd = new FormData();
    fd.set("projectId", project.id);
    startDup(() => {
      void duplicateProjectAction({}, fd);
    });
  }

  return (
    <>
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-h-11 w-full justify-center sm:min-h-9 sm:w-auto"
          onClick={() => setRenameOpen(true)}
        >
          <Pencil className="size-4" aria-hidden />
          Rename
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-h-11 w-full justify-center sm:min-h-9 sm:w-auto"
          disabled={dupPending}
          onClick={runDuplicate}
        >
          <Copy className="size-4" aria-hidden />
          {dupPending ? "Duplicating…" : "Duplicate"}
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="min-h-11 w-full justify-center sm:min-h-9 sm:w-auto"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="size-4" aria-hidden />
          Delete
        </Button>
      </div>

      <RenameProjectDialog
        projectId={project.id}
        title={project.title}
        open={renameOpen}
        onOpenChange={setRenameOpen}
      />

      <DeleteProjectDialog
        projectId={project.id}
        title={project.title}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
}

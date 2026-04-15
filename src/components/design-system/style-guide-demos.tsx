"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";

export function StyleGuideDialogDemo() {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Button type="button" size="touch" onClick={() => setOpen(true)}>
        Open sample dialog
      </Button>
      <p className="text-caption max-w-md">
        On viewports under 768px this opens as a bottom sheet; on desktop it opens as a centered
        dialog.
      </p>
      <ResponsiveDialog
        open={open}
        onOpenChange={setOpen}
        title="Export resume"
        description="Unlock PDF download after checkout. This is placeholder copy for the design system."
        footer={
          <>
            <Button type="button" variant="outline" size="touch" className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="button" size="touch" className="w-full sm:w-auto">
              Continue
            </Button>
          </>
        }
      >
        <p className="text-body-muted text-pretty">
          Primary actions use the touch size variant for comfortable taps on phones. Desktop
          users get slightly tighter controls automatically via responsive button sizes.
        </p>
      </ResponsiveDialog>
    </div>
  );
}

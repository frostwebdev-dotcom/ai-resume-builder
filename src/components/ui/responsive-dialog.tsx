"use client";

import * as React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

type ResponsiveDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Dialog width on desktop */
  contentClassName?: string;
};

/**
 * Desktop: centered `Dialog`. Mobile: bottom `Sheet` (thumb-friendly, full-width).
 * First paint assumes mobile until `matchMedia` runs — intentional mobile-first default.
 */
export function ResponsiveDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  contentClassName,
}: ResponsiveDialogProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={cn("gap-6 sm:max-w-md", contentClassName)}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description ? (
              <DialogDescription>{description}</DialogDescription>
            ) : (
              <DialogDescription className="sr-only">Dialog content</DialogDescription>
            )}
          </DialogHeader>
          <div className="grid gap-4">{children}</div>
          {footer ? <DialogFooter className="gap-2 sm:gap-2">{footer}</DialogFooter> : null}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[min(90vh,calc(100dvh-1rem))] gap-0 overflow-hidden p-0"
      >
        <SheetHeader className="border-b border-border px-4 pb-4 text-left">
          <SheetTitle>{title}</SheetTitle>
          {description ? (
            <SheetDescription>{description}</SheetDescription>
          ) : (
            <SheetDescription className="sr-only">Sheet content</SheetDescription>
          )}
        </SheetHeader>
        <div className="max-h-[60vh] overflow-y-auto overscroll-contain px-4 py-4">{children}</div>
        {footer ? (
          <SheetFooter className="border-t border-border bg-muted/30 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] [&>*]:w-full">
            {footer}
          </SheetFooter>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

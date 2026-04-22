"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type ResumeStudioSplitLayoutProps = {
  focusMode: boolean;
  mobilePreviewOpen: boolean;
  /** Template accent used to tint the preview column background (same as guest studio). */
  previewAccent: string;
  /** Editor column body (e.g. max-width inner wrapper + sections). */
  editor: ReactNode;
  /** Preview column body (preview canvas + sticky bottom toolbar, etc.). */
  preview: ReactNode;
  /** Mobile-only FAB (typically Edit/Preview toggle); pass `null` if unused. */
  mobileFab: ReactNode;
};

/**
 * Shared two-pane studio chrome: responsive grid, editor scroll pane, preview pane
 * with accent-tinted backdrop, visibility rules for focus/mobile preview.
 * Presentation-only — callers own state and children.
 */
export function ResumeStudioSplitLayout({
  focusMode,
  mobilePreviewOpen,
  previewAccent,
  editor,
  preview,
  mobileFab,
}: ResumeStudioSplitLayoutProps) {
  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)]">
      {/* Left: editor */}
      <div
        className={cn(
          "min-h-0 overflow-y-auto border-border/70 bg-white lg:border-r",
          // On mobile the preview is a separate toggle-able pane — show
          // the editor full height by default so there is no outer scroll.
          focusMode ? "hidden" : "block",
          mobilePreviewOpen ? "hidden lg:block" : "",
        )}
      >
        {editor}
      </div>

      {/* Right: preview */}
      <div
        className={cn(
          "relative flex min-h-0 flex-col transition-[background-color] duration-300 ease-out",
          focusMode ? "col-span-full" : "",
          !mobilePreviewOpen && !focusMode ? "hidden lg:flex" : "flex",
        )}
        style={{
          backgroundColor: `color-mix(in srgb, ${previewAccent} 10%, rgb(241 245 249))`,
        }}
      >
        {preview}
      </div>

      {mobileFab}
    </div>
  );
}

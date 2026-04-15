"use client";

import { useEffect } from "react";

/**
 * Warn when closing the tab with unsaved edits (best-effort; mobile browsers vary).
 */
export function useUnsavedWarning(shouldWarn: boolean, message?: string) {
  useEffect(() => {
    if (!shouldWarn) return;
    const msg =
      message ??
      "You have unsaved changes. Leave this page? Your work may not be saved yet.";
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = msg;
      return msg;
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [shouldWarn, message]);
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { WizardStateV1 } from "@/lib/resume-wizard/types";
import { saveWizardDraftAction } from "@/services/resume-wizard/actions";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

type UseWizardAutosaveOptions = {
  projectId: string;
  state: WizardStateV1;
  debounceMs?: number;
  /** When false, skips all network/local persistence (use alongside guest localStorage hook). */
  enabled?: boolean;
};

/**
 * Debounced autosave: compares against last successful server snapshot (no ref reads during render).
 */
export function useWizardAutosave({
  projectId,
  state,
  debounceMs = 900,
  enabled = true,
}: UseWizardAutosaveOptions) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastOkJson, setLastOkJson] = useState(() => JSON.stringify(state));
  const hydratedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  });

  const flushSave = useCallback(async (): Promise<boolean> => {
    if (!enabled) return true;
    const current = stateRef.current;
    const snapshot = JSON.stringify(current);
    setSaveStatus("saving");
    setLastError(null);
    const result = await saveWizardDraftAction(projectId, current);
    if (result.ok) {
      setLastOkJson(snapshot);
      setSaveStatus("saved");
      return true;
    }
    setSaveStatus("error");
    setLastError(result.error);
    return false;
  }, [projectId, enabled]);

  const isDirty = enabled ? JSON.stringify(state) !== lastOkJson : false;

  useEffect(() => {
    if (!enabled) return;
    const serialized = JSON.stringify(state);
    if (!hydratedRef.current) {
      hydratedRef.current = true;
      return;
    }
    if (serialized === lastOkJson) {
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      void flushSave();
    }, debounceMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [state, debounceMs, flushSave, lastOkJson, enabled]);

  const retry = useCallback(() => {
    void flushSave();
  }, [flushSave]);

  const lastOkJsonRef = useRef(lastOkJson);
  useEffect(() => {
    lastOkJsonRef.current = lastOkJson;
  }, [lastOkJson]);

  /** Best-effort sync when leaving the tab (pairs with `useUnsavedWarning` on the same page). */
  useEffect(() => {
    if (!enabled) return;
    const onVisibility = () => {
      if (document.visibilityState !== "hidden") return;
      const serialized = JSON.stringify(stateRef.current);
      if (serialized === lastOkJsonRef.current) return;
      void flushSave();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [enabled, flushSave]);

  return { saveStatus, lastError, retry, flushSave, isDirty };
}

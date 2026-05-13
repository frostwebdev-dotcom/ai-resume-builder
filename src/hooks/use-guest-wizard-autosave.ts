"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { SaveStatus } from "@/hooks/use-wizard-autosave";
import {
  saveGuestWizardDraftToStorage,
} from "@/lib/resume-wizard/guest-draft-storage";
import type { WizardStateV1 } from "@/lib/resume-wizard/types";

type Options = {
  state: WizardStateV1;
  debounceMs?: number;
  enabled?: boolean;
};

/**
 * Mirrors `useWizardAutosave` but persists to `localStorage` instead of Supabase.
 * Used on the public `/create` route so visitors can build without an account.
 */
export function useGuestWizardAutosave({
  state,
  debounceMs = 900,
  enabled = true,
}: Options) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastOkJson, setLastOkJson] = useState(() => JSON.stringify(state));
  const hydratedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef(state);
  const lastOkJsonRef = useRef(lastOkJson);

  useEffect(() => {
    stateRef.current = state;
  });

  useEffect(() => {
    lastOkJsonRef.current = lastOkJson;
  }, [lastOkJson]);

  const persist = useCallback((json: string) => {
    const parsed = JSON.parse(json) as WizardStateV1;
    saveGuestWizardDraftToStorage(parsed);
  }, []);

  const flushSave = useCallback(async (): Promise<boolean> => {
    if (!enabled) return true;
    const current = stateRef.current;
    const snapshot = JSON.stringify(current);
    setSaveStatus("saving");
    setLastError(null);
    try {
      persist(snapshot);
      setLastOkJson(snapshot);
      setSaveStatus("saved");
      return true;
    } catch (e) {
      console.warn("[guest-wizard] localStorage write failed", e);
      setSaveStatus("error");
      setLastError(
        "Could not save on this device (storage may be full, blocked, or private mode is on).",
      );
      return false;
    }
  }, [enabled, persist]);

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

  /** Flush to disk when the user switches tabs or minimizes (reduces loss on mobile). */
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

  const retry = useCallback(() => {
    void flushSave();
  }, [flushSave]);

  return { saveStatus, lastError, retry, flushSave, isDirty };
}

export { loadGuestWizardDraftFromStorage } from "@/lib/resume-wizard/guest-draft-storage";
export { clearGuestWizardDraftFromStorage } from "@/lib/resume-wizard/guest-draft-storage";

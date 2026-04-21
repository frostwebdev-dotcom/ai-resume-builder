"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { hydrateWizardState } from "@/lib/resume-wizard/parse";
import type { WizardStateV1 } from "@/lib/resume-wizard/types";

import type { SaveStatus } from "@/hooks/use-wizard-autosave";

const STORAGE_KEY = "resume-real-andy:guest-wizard-draft:v1";

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

  useEffect(() => {
    stateRef.current = state;
  });

  const persist = useCallback((json: string) => {
    try {
      localStorage.setItem(STORAGE_KEY, json);
    } catch (e) {
      console.warn("[guest-wizard] localStorage write failed", e);
      throw e;
    }
  }, []);

  const flushSave = useCallback(async () => {
    if (!enabled) return;
    const current = stateRef.current;
    const snapshot = JSON.stringify(current);
    setSaveStatus("saving");
    setLastError(null);
    try {
      persist(snapshot);
      setLastOkJson(snapshot);
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
      setLastError(
        "Could not save on this device (storage may be full, blocked, or private mode is on).",
      );
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

  const retry = useCallback(() => {
    void flushSave();
  }, [flushSave]);

  return { saveStatus, lastError, retry, flushSave, isDirty };
}

export function loadGuestWizardDraftFromStorage(): WizardStateV1 | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed &&
      typeof parsed === "object" &&
      "v" in parsed &&
      (parsed as { v: unknown }).v === 1
    ) {
      return hydrateWizardState(parsed);
    }
  } catch {
    /* ignore corrupt drafts */
  }
  return null;
}

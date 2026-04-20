"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";

import {
  DEFAULT_RESUME_STYLE_V1,
  type ResumeStyleV1,
} from "@/lib/resume-preview/resume-style";
import { type TemplateSlug, isTemplateSlug } from "@/lib/resume-preview/template-ids";

/**
 * Persisted presentation state for the guest studio editor:
 * chosen template + resume styling overrides + document title.
 * Kept separately from the resume content draft (WizardStateV1)
 * so users can change look without touching content, and vice versa.
 */
export type GuestStudioPresentation = {
  v: 1;
  templateSlug: TemplateSlug;
  style: ResumeStyleV1;
  title: string;
};

const STORAGE_KEY = "resume-real-andy:guest-studio-presentation:v1";

/** Sidebar layout — reads as one polished product template in the studio preview. */
const DEFAULT_GUEST_TEMPLATE: TemplateSlug = "denali";

export const DEFAULT_GUEST_PRESENTATION: GuestStudioPresentation = {
  v: 1,
  templateSlug: DEFAULT_GUEST_TEMPLATE,
  style: DEFAULT_RESUME_STYLE_V1,
  title: "Untitled resume",
};

function isPresentation(value: unknown): value is GuestStudioPresentation {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<GuestStudioPresentation>;
  if (v.v !== 1) return false;
  if (typeof v.templateSlug !== "string" || !isTemplateSlug(v.templateSlug)) return false;
  if (!v.style || typeof v.style !== "object" || (v.style as ResumeStyleV1).v !== 1) return false;
  if (typeof v.title !== "string") return false;
  return true;
}

export function loadGuestPresentationFromStorage(): GuestStudioPresentation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (isPresentation(parsed)) return parsed;
  } catch {
    /* ignore corrupt draft */
  }
  return null;
}

/**
 * Debounced persistence for the visual presentation (template + style + title).
 * Writes the latest value back to `localStorage` ~500ms after the last change.
 */
export function useGuestPresentationAutosave(value: GuestStudioPresentation, enabled: boolean = true) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    if (!hydratedRef.current) {
      hydratedRef.current = true;
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      } catch {
        /* quota errors are non-fatal — users can still edit in memory */
      }
    }, 500);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, enabled]);
}

/* -------------------------------------------------------------------------- */
/*                              Undo / Redo buffer                            */
/* -------------------------------------------------------------------------- */

type HistoryState<T> = {
  past: T[];
  future: T[];
};

type HistoryAction<T> =
  | { type: "commit"; snapshot: T; max: number }
  | { type: "undo"; pushForward: T }
  | { type: "redo"; pushBack: T; max: number };

function historyReducer<T>(state: HistoryState<T>, action: HistoryAction<T>): HistoryState<T> {
  switch (action.type) {
    case "commit": {
      const nextPast = [...state.past, action.snapshot];
      const trimmed =
        nextPast.length > action.max ? nextPast.slice(nextPast.length - action.max) : nextPast;
      return { past: trimmed, future: [] };
    }
    case "undo": {
      if (state.past.length === 0) return state;
      return {
        past: state.past.slice(0, -1),
        future: [action.pushForward, ...state.future],
      };
    }
    case "redo": {
      if (state.future.length === 0) return state;
      const nextPast = [...state.past, action.pushBack];
      const trimmed =
        nextPast.length > action.max ? nextPast.slice(nextPast.length - action.max) : nextPast;
      return { past: trimmed, future: state.future.slice(1) };
    }
  }
}

export type CoalescedHistory<T> = {
  /** Coalesces rapid calls within `delayMs` into a single slot. */
  commit: (snapshotBeforeEdit: T, immediate?: boolean) => void;
  /** Pop the last history entry; caller must apply it and push its current value. */
  undo: (currentSnapshot: T) => T | null;
  /** Pop the next forward entry; caller must apply it and push its current value. */
  redo: (currentSnapshot: T) => T | null;
  canUndo: boolean;
  canRedo: boolean;
  /** Force any pending debounced slot to be recorded immediately. */
  flush: () => void;
};

/**
 * Coalesced undo/redo buffer. The caller owns the "present" value via its
 * own `useState`. This hook just tracks the past and future stacks.
 *
 * Rapid `commit` calls within `delayMs` collapse into a single history slot
 * (word-boundary undo, like Google Docs). Clicks/menu choices should pass
 * `immediate: true` so they create discrete undo steps.
 */
export function useCoalescedHistory<T>(opts: { delayMs?: number; max?: number } = {}): CoalescedHistory<T> {
  const { delayMs = 600, max = 50 } = opts;
  const [state, dispatch] = useReducer(historyReducer as React.Reducer<HistoryState<T>, HistoryAction<T>>, {
    past: [],
    future: [],
  });

  const pendingRef = useRef<T | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushNow = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const pending = pendingRef.current;
    if (pending !== null) {
      pendingRef.current = null;
      dispatch({ type: "commit", snapshot: pending, max });
    }
  }, [max]);

  const commit = useCallback(
    (snapshotBeforeEdit: T, immediate?: boolean) => {
      if (pendingRef.current === null) {
        pendingRef.current = snapshotBeforeEdit;
      }
      if (timerRef.current) clearTimeout(timerRef.current);
      if (immediate) {
        flushNow();
        return;
      }
      timerRef.current = setTimeout(() => {
        flushNow();
      }, delayMs);
    },
    [delayMs, flushNow],
  );

  const undo = useCallback(
    (currentSnapshot: T): T | null => {
      flushNow();
      if (state.past.length === 0) return null;
      const previous = state.past[state.past.length - 1];
      dispatch({ type: "undo", pushForward: currentSnapshot });
      return previous;
    },
    [flushNow, state.past],
  );

  const redo = useCallback(
    (currentSnapshot: T): T | null => {
      flushNow();
      if (state.future.length === 0) return null;
      const next = state.future[0];
      dispatch({ type: "redo", pushBack: currentSnapshot, max });
      return next;
    },
    [flushNow, max, state.future],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return {
    commit,
    undo,
    redo,
    flush: flushNow,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
  };
}

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { cn } from "@/lib/utils";

const STORAGE_KEY = "app-sidebar:collapsed";

type Ctx = {
  /** True when the desktop sidebar is collapsed (hidden from view). */
  collapsed: boolean;
  toggle: () => void;
  setCollapsed: (next: boolean) => void;
};

/*
 * External store for the sidebar's collapsed state.
 *
 * We intentionally hold this outside React so:
 *   - `useSyncExternalStore` renders the server snapshot (`false` → expanded)
 *     on SSR and the first client paint, then transitions to the real value
 *     after hydration. No `setState`-in-effect needed and no hydration
 *     mismatch warning.
 *   - Any component (sidebar, re-open handle, per-page toggle button) can
 *     subscribe to the same store, and a single click updates them all in
 *     one frame without prop drilling.
 *   - The `storage` event keeps multiple open tabs of the app in sync.
 */
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((cb) => cb());
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function readCollapsed(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeCollapsed(next: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
  } catch {
    // Storage may be unavailable (private mode, disabled cookies); we still
    // notify subscribers so the in-memory UI state updates for this tab.
  }
  notify();
}

function getServerSnapshot(): boolean {
  return false;
}

const SidebarVisibilityContext = createContext<Ctx | null>(null);

/**
 * Desktop sidebar visibility state.
 *
 * The decision lives above the sidebar and the page shell so a single toggle
 * (button or keyboard shortcut) can hide/reveal it for every app route.
 * Persisting in `localStorage` keeps the choice across reloads — users who
 * prefer a distraction-free workspace only configure it once.
 */
export function SidebarVisibilityProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const collapsed = useSyncExternalStore(subscribe, readCollapsed, getServerSnapshot);

  const setCollapsed = useCallback((next: boolean) => {
    writeCollapsed(next);
  }, []);

  const toggle = useCallback(() => {
    writeCollapsed(!readCollapsed());
  }, []);

  useEffect(() => {
    // Ctrl+B (Cmd+B on macOS) mirrors the familiar IDE shortcut. We avoid
    // stealing the combo when the user is actively composing in an input so
    // text formatting shortcuts inside the wizard keep working.
    const onKey = (event: KeyboardEvent) => {
      const isToggle = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "b";
      if (!isToggle) return;
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) return;
      event.preventDefault();
      toggle();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  const value = useMemo<Ctx>(
    () => ({ collapsed, toggle, setCollapsed }),
    [collapsed, toggle, setCollapsed],
  );

  return (
    <SidebarVisibilityContext.Provider value={value}>
      {children}
    </SidebarVisibilityContext.Provider>
  );
}

export function useSidebarVisibility(): Ctx {
  const ctx = useContext(SidebarVisibilityContext);
  if (!ctx) {
    throw new Error(
      "useSidebarVisibility must be used inside <SidebarVisibilityProvider>",
    );
  }
  return ctx;
}

type ToggleProps = {
  className?: string;
  /**
   * When true, the button is rendered in-line with other chrome and gets a
   * bordered pill appearance. When false (default) the button is a compact
   * icon square suitable for the sidebar header and the re-open handle.
   */
  inline?: boolean;
};

/**
 * Small icon button that toggles the desktop sidebar. Hidden on mobile (the
 * bottom navigation already handles navigation on small screens).
 */
export function SidebarToggleButton({ className, inline = false }: ToggleProps) {
  const { collapsed, toggle } = useSidebarVisibility();
  const label = collapsed ? "Show sidebar" : "Hide sidebar";
  const Icon = collapsed ? PanelLeftOpen : PanelLeftClose;
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      aria-pressed={collapsed}
      title={`${label} (Ctrl/Cmd + B)`}
      className={cn(
        "hidden md:inline-flex items-center justify-center transition-colors",
        inline
          ? "h-9 gap-1.5 rounded-lg border border-border bg-card px-2.5 text-sm text-muted-foreground hover:text-foreground"
          : "size-8 rounded-md text-muted-foreground hover:bg-muted/70 hover:text-foreground",
        className,
      )}
    >
      <Icon className="size-4" aria-hidden />
      {inline ? <span className="text-caption font-medium">Sidebar</span> : null}
    </button>
  );
}

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { PanelLeft } from "lucide-react";

import { cn } from "@/lib/utils";

const STORAGE_MODE_KEY = "app-sidebar:mode";
const LEGACY_COLLAPSED_KEY = "app-sidebar:collapsed";

export type SidebarMode = "expanded" | "collapsed" | "expand-on-hover";

const MODE_ORDER: SidebarMode[] = ["expanded", "collapsed", "expand-on-hover"];

type Ctx = {
  mode: SidebarMode;
  setMode: (next: SidebarMode) => void;
  /**
   * When true, the sidebar uses the narrow icon rail (no section labels).
   * In expand-on-hover mode this follows pointer / open menus.
   */
  narrowRail: boolean;
  setRailHovered: (value: boolean) => void;
  setAccountMenuOpen: (open: boolean) => void;
  /** Ctrl/Cmd + B — cycles Expanded → Collapsed → Expand on hover. */
  cycleMode: () => void;
};

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((cb) => cb());
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_MODE_KEY || event.key === LEGACY_COLLAPSED_KEY) onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function readMode(): SidebarMode {
  try {
    const raw = window.localStorage.getItem(STORAGE_MODE_KEY);
    if (raw === "expanded" || raw === "collapsed" || raw === "expand-on-hover") {
      return raw;
    }
    if (window.localStorage.getItem(LEGACY_COLLAPSED_KEY) === "1") {
      return "collapsed";
    }
    return "expanded";
  } catch {
    return "expanded";
  }
}

function writeMode(next: SidebarMode) {
  try {
    window.localStorage.setItem(STORAGE_MODE_KEY, next);
    window.localStorage.removeItem(LEGACY_COLLAPSED_KEY);
  } catch {
    // Storage may be unavailable; still notify so this tab updates.
  }
  notify();
}

function getServerSnapshot(): SidebarMode {
  return "expanded";
}

const SidebarVisibilityContext = createContext<Ctx | null>(null);

/**
 * Desktop sidebar layout mode (full rail, icon rail, or icon rail that
 * expands while hovered). Persisted in `localStorage`; `storage` events
 * sync additional tabs.
 */
export function SidebarVisibilityProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const mode = useSyncExternalStore(subscribe, readMode, getServerSnapshot);
  const [railHovered, setRailHovered] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  useEffect(() => {
    if (mode !== "expand-on-hover") {
      setRailHovered(false);
    }
  }, [mode]);

  const setMode = useCallback((next: SidebarMode) => {
    writeMode(next);
  }, []);

  const cycleMode = useCallback(() => {
    const cur = readMode();
    const i = MODE_ORDER.indexOf(cur);
    writeMode(MODE_ORDER[(i === -1 ? 0 : i + 1) % MODE_ORDER.length]);
  }, []);

  const narrowRail = useMemo(() => {
    if (mode === "expanded") return false;
    if (mode === "collapsed") return true;
    /* Expand on hover: widen for pointer on rail or account menu (portaled); sidebar
       control stays on the narrow trigger so the menu anchor does not jump. */
    const expandedByHover = railHovered || accountMenuOpen;
    return !expandedByHover;
  }, [mode, railHovered, accountMenuOpen]);

  const value = useMemo<Ctx>(
    () => ({
      mode,
      setMode,
      narrowRail,
      setRailHovered,
      setAccountMenuOpen,
      cycleMode,
    }),
    [mode, setMode, narrowRail, cycleMode],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const isCycle = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "b";
      if (!isCycle) return;
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) return;
      event.preventDefault();
      cycleMode();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cycleMode]);

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
   * icon square.
   */
  inline?: boolean;
};

/**
 * Cycles sidebar layout (Expanded → Collapsed → Expand on hover). Hidden on
 * mobile. Prefer the footer “Sidebar control” menu for discovery.
 */
export function SidebarToggleButton({ className, inline = false }: ToggleProps) {
  const { cycleMode, mode } = useSidebarVisibility();
  const label = "Cycle sidebar layout";
  return (
    <button
      type="button"
      onClick={cycleMode}
      aria-label={`${label} (current: ${mode}). Shortcut: Ctrl or Cmd + B.`}
      title={`${label} (Ctrl/Cmd + B)`}
      className={cn(
        "hidden md:inline-flex items-center justify-center transition-colors",
        inline
          ? "h-9 gap-1.5 rounded-lg border border-border bg-card px-2.5 text-sm text-muted-foreground hover:text-foreground"
          : "size-8 rounded-md text-muted-foreground hover:bg-muted/70 hover:text-foreground",
        className,
      )}
    >
      <PanelLeft className="size-4" aria-hidden />
      {inline ? <span className="text-caption font-medium">Sidebar</span> : null}
    </button>
  );
}

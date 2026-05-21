"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  Sparkles,
  Underline,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { AI_ASSIST_FAIR_USE_LINE } from "@/lib/ai/assist-client-copy";
import {
  isProfileDescriptionEmpty,
  looksLikeProfileHtml,
  plainTextToProfileDisplayHtml,
  sanitizeProfileDescriptionHtml,
} from "@/lib/profile-description-html";

type Props = {
  id?: string;
  value: string;
  onChange: (html: string) => void;
  loginHref: string;
  className?: string;
  /**
   * When `true`, hides the old "Sign in for AI assist" CTA because an AI panel
   * is rendered below this editor (signed-in projects and public guest drafts).
   */
  signedIn?: boolean;
};

type ToolbarState = {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  bulletList: boolean;
  orderedList: boolean;
  alignLeft: boolean;
  alignCenter: boolean;
  alignRight: boolean;
  inLink: boolean;
};

const TOOLBAR_IDLE: ToolbarState = {
  bold: false,
  italic: false,
  underline: false,
  bulletList: false,
  orderedList: false,
  alignLeft: false,
  alignCenter: false,
  alignRight: false,
  inLink: false,
};

function computeEditorHtml(stored: string): string {
  const t = stored.trim();
  if (!t) return "<br />";
  return looksLikeProfileHtml(t) ? sanitizeProfileDescriptionHtml(t) : plainTextToProfileDisplayHtml(t);
}

function exec(cmd: string, value?: string) {
  try {
    document.execCommand(cmd, false, value);
  } catch {
    /* ignore */
  }
}

function selectionInsideEditor(el: HTMLElement | null): boolean {
  if (!el) return false;
  const sel = document.getSelection();
  const node = sel?.anchorNode;
  if (!sel || sel.rangeCount === 0 || !node) return false;
  return el.contains(node);
}

function anchorAtSelection(el: HTMLElement): boolean {
  const sel = document.getSelection();
  let n: Node | null = sel?.anchorNode ?? null;
  if (n?.nodeType === Node.TEXT_NODE) n = (n as Text).parentElement;
  while (n && n !== el) {
    if (n instanceof HTMLAnchorElement) return true;
    n = n.parentElement;
  }
  return false;
}

function readToolbarState(el: HTMLElement | null): ToolbarState {
  if (!el || typeof document.queryCommandState !== "function") {
    return { ...TOOLBAR_IDLE };
  }
  if (!selectionInsideEditor(el)) {
    return { ...TOOLBAR_IDLE };
  }
  try {
    return {
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      bulletList: document.queryCommandState("insertUnorderedList"),
      orderedList: document.queryCommandState("insertOrderedList"),
      alignLeft: document.queryCommandState("justifyLeft"),
      alignCenter: document.queryCommandState("justifyCenter"),
      alignRight: document.queryCommandState("justifyRight"),
      inLink: anchorAtSelection(el),
    };
  } catch {
    return { ...TOOLBAR_IDLE };
  }
}

export function ProfileDescriptionEditor({
  id = "guest-profile-description",
  value,
  onChange,
  loginHref,
  className,
  signedIn = false,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const pendingFromEditor = useRef<string | null>(null);
  const rafToolbar = useRef<number | null>(null);
  const [toolbar, setToolbar] = useState<ToolbarState>(TOOLBAR_IDLE);

  const scheduleToolbarRefresh = useCallback(() => {
    if (rafToolbar.current != null) {
      cancelAnimationFrame(rafToolbar.current);
    }
    rafToolbar.current = requestAnimationFrame(() => {
      rafToolbar.current = null;
      setToolbar(readToolbarState(ref.current));
    });
  }, []);

  const emitFromDom = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const clean = sanitizeProfileDescriptionHtml(el.innerHTML);
    const stored = isProfileDescriptionEmpty(clean) ? "" : clean;
    pendingFromEditor.current = stored;
    onChange(stored);
    scheduleToolbarRefresh();
  }, [onChange, scheduleToolbarRefresh]);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (value === pendingFromEditor.current) {
      pendingFromEditor.current = null;
      return;
    }
    pendingFromEditor.current = null;
    const nextDisplay = computeEditorHtml(value);
    const curSan = sanitizeProfileDescriptionHtml(el.innerHTML);
    const nextSan = sanitizeProfileDescriptionHtml(nextDisplay);
    if (curSan === nextSan) return;
    el.innerHTML = nextDisplay;
    scheduleToolbarRefresh();
  }, [value, scheduleToolbarRefresh]);

  useEffect(() => {
    const onSelectionChange = () => scheduleToolbarRefresh();
    document.addEventListener("selectionchange", onSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", onSelectionChange);
      if (rafToolbar.current != null) cancelAnimationFrame(rafToolbar.current);
    };
  }, [scheduleToolbarRefresh]);

  /** Improves `insertUnorderedList` / `insertOrderedList` in contentEditable (esp. Chrome). */
  useEffect(() => {
    try {
      document.execCommand("styleWithCSS", false, "false");
    } catch {
      /* ignore */
    }
    try {
      document.execCommand("defaultParagraphSeparator", false, "p");
    } catch {
      /* ignore */
    }
  }, []);

  const runFormat = (cmd: string, arg?: string) => {
    const el = ref.current;
    if (!el) return;
    el.focus();

    const apply = () => {
      exec(cmd, arg);
      emitFromDom();
    };

    if (cmd === "insertUnorderedList" || cmd === "insertOrderedList") {
      requestAnimationFrame(apply);
    } else {
      apply();
    }
  };

  const onLinkClick = () => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    if (anchorAtSelection(el)) {
      exec("unlink");
    } else {
      const raw = window.prompt("Paste a full URL (https://…)", "https://");
      const url = raw?.trim();
      if (url && /^https?:\/\//i.test(url)) {
        exec("createLink", url);
      }
    }
    emitFromDom();
  };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50/40 shadow-inner shadow-black/[0.03]",
        className,
      )}
    >
      <div
        id={id}
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline
        aria-label="Profile description"
        onInput={emitFromDom}
        onBlur={emitFromDom}
        onMouseUp={scheduleToolbarRefresh}
        onKeyUp={scheduleToolbarRefresh}
        className={cn(
          "min-h-[10.5rem] max-h-[min(28rem,55vh)] overflow-y-auto px-3 py-2.5 text-[0.9375rem] leading-relaxed text-neutral-900 outline-none",
          "[&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-[1.35em]",
          "[&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-[1.25em]",
          "[&_li]:my-0.5 [&_li]:pl-0.5",
        )}
        style={{ lineHeight: 1.55 }}
      />

      <div className="flex flex-wrap items-center gap-0.5 border-t border-neutral-200/90 bg-neutral-100/80 px-1.5 py-1">
        <ToolbarIcon
          label="Bold"
          pressed={toolbar.bold}
          onClick={() => runFormat("bold")}
          icon={<Bold className="size-4" aria-hidden />}
        />
        <ToolbarIcon
          label="Italic"
          pressed={toolbar.italic}
          onClick={() => runFormat("italic")}
          icon={<Italic className="size-4" aria-hidden />}
        />
        <ToolbarIcon
          label="Underline"
          pressed={toolbar.underline}
          onClick={() => runFormat("underline")}
          icon={<Underline className="size-4" aria-hidden />}
        />
        <span className="mx-0.5 h-5 w-px bg-neutral-200" aria-hidden />
        <ToolbarIcon
          label={toolbar.inLink ? "Remove link" : "Insert link"}
          pressed={toolbar.inLink}
          onClick={onLinkClick}
          icon={<Link2 className="size-4" aria-hidden />}
        />
        <span className="mx-0.5 h-5 w-px bg-neutral-200" aria-hidden />
        <ToolbarIcon
          label="Bullet list"
          pressed={toolbar.bulletList}
          onClick={() => runFormat("insertUnorderedList")}
          icon={<List className="size-4" aria-hidden />}
        />
        <ToolbarIcon
          label="Numbered list"
          pressed={toolbar.orderedList}
          onClick={() => runFormat("insertOrderedList")}
          icon={<ListOrdered className="size-4" aria-hidden />}
        />
        <span className="mx-0.5 h-5 w-px bg-neutral-200" aria-hidden />
        <ToolbarIcon
          label="Align left"
          pressed={toolbar.alignLeft}
          onClick={() => runFormat("justifyLeft")}
          icon={<AlignLeft className="size-4" aria-hidden />}
        />
        <ToolbarIcon
          label="Align center"
          pressed={toolbar.alignCenter}
          onClick={() => runFormat("justifyCenter")}
          icon={<AlignCenter className="size-4" aria-hidden />}
        />
        <ToolbarIcon
          label="Align right"
          pressed={toolbar.alignRight}
          onClick={() => runFormat("justifyRight")}
          icon={<AlignRight className="size-4" aria-hidden />}
        />

        {signedIn ? null : (
          <Link
            href={loginHref}
            title={`After sign-in, open Draft on a saved project. ${AI_ASSIST_FAIR_USE_LINE}`}
            className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-[#2268d7]/35 bg-white px-3 py-1.5 text-xs font-semibold text-[#2268d7] shadow-sm transition-colors hover:bg-[#2268d7]/5"
          >
            <Sparkles className="size-3.5 shrink-0 opacity-80" aria-hidden />
            Sign in for AI assist
          </Link>
        )}
      </div>
      {signedIn ? null : (
        <p className="border-t border-neutral-200/90 bg-neutral-50 px-2.5 py-1.5 text-[0.65rem] leading-snug text-neutral-600">
          AI runs in Draft after sign-in only; updates your profile from your text—does not invent employers or jobs you
          did not describe. Fair-use limits keep responses fast for everyone—always verify before you apply.
        </p>
      )}
    </div>
  );
}

function ToolbarIcon({
  label,
  pressed,
  onClick,
  icon,
  disabled,
}: {
  label: string;
  pressed?: boolean;
  onClick?: () => void;
  icon: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={pressed ? true : undefined}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => onClick?.()}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-md text-neutral-600 transition-colors",
        disabled
          ? "cursor-not-allowed opacity-40"
          : cn(
              "hover:bg-neutral-200/80 hover:text-neutral-900",
              pressed &&
                "bg-[#2268d7]/15 text-[#2268d7] ring-1 ring-[#2268d7]/30 hover:bg-[#2268d7]/20 hover:text-[#2268d7]",
            ),
      )}
    >
      {icon}
    </button>
  );
}

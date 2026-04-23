"use client";

import type { ReactNode } from "react";

import { useAppLoginPanel } from "@/components/layout/app-login-panel";
import { cn } from "@/lib/utils";

type Props = {
  /** Post-login redirect target (sanitized inside the login panel). */
  nextPath: string;
  children: ReactNode;
  className?: string;
};

export function GuestAppRouteBanner({ nextPath, children, className }: Props) {
  const { openLogin } = useAppLoginPanel();

  return (
    <div
      className={cn(
        "mb-6 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm sm:px-5",
        className,
      )}
    >
      <span className="text-slate-700">{children}</span>{" "}
      <button
        type="button"
        onClick={() => openLogin(nextPath)}
        className="font-semibold text-[#2268d7] underline-offset-2 hover:underline"
      >
        Sign in
      </button>
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";

import { trackClientEvent } from "@/lib/analytics/client";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";

type ResumeStTrackerProps = {
  surface: "guest_create" | "project_build";
  /** Required when `surface` is `project_build` — dedupes per project per tab session. */
  projectId?: string;
};

/**
 * Fires `resume_st` once per session for the guest builder, or once per project per session on build.
 */
export function ResumeStTracker({ surface, projectId }: ResumeStTrackerProps) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    if (surface === "project_build" && !projectId) return;

    const storageKey =
      surface === "guest_create"
        ? "analytics_resume_st_guest"
        : `analytics_resume_st_project_${projectId}`;

    try {
      if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(storageKey)) {
        fired.current = true;
        return;
      }
      trackClientEvent(ANALYTICS_EVENTS.RESUME_ST, { surface });
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.setItem(storageKey, "1");
      }
    } catch {
      trackClientEvent(ANALYTICS_EVENTS.RESUME_ST, { surface });
    }
    fired.current = true;
  }, [surface, projectId]);

  return null;
}

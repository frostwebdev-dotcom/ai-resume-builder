"use client";

import { useEffect, useRef } from "react";

import { trackClientEvent } from "@/lib/analytics/client";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";

export function PreviewViewedTracker({ projectId }: { projectId: string }) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    trackClientEvent(ANALYTICS_EVENTS.PREVIEW_VIEWED, {
      project_id_prefix: projectId.slice(0, 8),
    });
  }, [projectId]);
  return null;
}

"use client";

import { useEffect, useRef } from "react";

import { trackClientEvent } from "@/lib/analytics/client";
import type { AnalyticsEventName } from "@/lib/analytics/events";

type HomepageSectionViewTrackerProps = {
  event: AnalyticsEventName;
  section: string;
};

export function HomepageSectionViewTracker({
  event,
  section,
}: HomepageSectionViewTrackerProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const trackedRef = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || trackedRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || trackedRef.current) return;
        trackedRef.current = true;
        trackClientEvent(event, { section });
        observer.disconnect();
      },
      { rootMargin: "0px 0px -20% 0px", threshold: 0.35 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [event, section]);

  return <span ref={ref} className="block h-px w-px opacity-0" aria-hidden />;
}

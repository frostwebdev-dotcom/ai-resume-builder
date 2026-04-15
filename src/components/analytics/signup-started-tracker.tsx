"use client";

import { useEffect, useRef } from "react";

import { trackClientEvent } from "@/lib/analytics/client";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";

/** Fires once per mount — funnel step "signup started". */
export function SignupStartedTracker() {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    trackClientEvent(ANALYTICS_EVENTS.SIGNUP_STARTED);
  }, []);
  return null;
}

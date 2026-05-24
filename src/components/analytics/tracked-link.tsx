"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

import { trackClientEvent } from "@/lib/analytics/client";
import { ANALYTICS_EVENTS, type AnalyticsEventName } from "@/lib/analytics/events";
import type { LandingCtaPayload } from "@/lib/analytics/payloads";
import { cn } from "@/lib/utils";

type TrackedLinkProps = ComponentProps<typeof Link> & {
  cta: LandingCtaPayload["cta"];
  /** Fires once per click (navigation still proceeds). */
  trackEvent?: AnalyticsEventName;
  /** Optional list for funnels that need a legacy event plus a more specific event. */
  trackEvents?: AnalyticsEventName[];
};

export function TrackedLink({
  href,
  cta,
  trackEvent = ANALYTICS_EVENTS.LANDING_CTA_CLICK,
  trackEvents,
  onClick,
  className,
  children,
  ...rest
}: TrackedLinkProps) {
  const hrefStr = typeof href === "string" ? href : href.pathname ?? "";

  return (
    <Link
      {...rest}
      href={href}
      className={cn(className)}
      onClick={(e) => {
        const events = trackEvents ?? [trackEvent];
        for (const event of events) {
          trackClientEvent(event, {
            cta,
            href: hrefStr.slice(0, 200),
          });
        }
        onClick?.(e);
      }}
    >
      {children}
    </Link>
  );
}

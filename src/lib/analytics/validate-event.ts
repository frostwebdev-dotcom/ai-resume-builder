import { z } from "zod";

import { ANALYTICS_EVENT_NAMES, type AnalyticsEventName } from "@/lib/analytics/events";

const propsSchema = z
  .record(
    z.string(),
    z.union([z.string(), z.number(), z.boolean(), z.null()]).optional(),
  )
  .optional();

export const inboundAnalyticsEventSchema = z.object({
  event: z
    .string()
    .refine((e): e is AnalyticsEventName => (ANALYTICS_EVENT_NAMES as readonly string[]).includes(e), {
      message: "Unknown event",
    }),
  props: propsSchema,
  /** Client clock ms (optional; server uses authoritative time in logs). */
  client_ts: z.number().optional(),
});

export type InboundAnalyticsEvent = z.infer<typeof inboundAnalyticsEventSchema>;

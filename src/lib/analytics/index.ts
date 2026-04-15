/**
 * Browser-safe exports. Server code: `import { trackServerEvent } from "@/lib/analytics/server"`.
 */
export { ANALYTICS_EVENTS, ANALYTICS_EVENT_NAMES, type AnalyticsEventName } from "./events";
export { trackClientEvent } from "./client";
export { inboundAnalyticsEventSchema, type InboundAnalyticsEvent } from "./validate-event";

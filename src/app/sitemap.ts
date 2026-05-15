import type { MetadataRoute } from "next";

import { ROUTES } from "@/lib/constants";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const paths = [
    ROUTES.home,
    ROUTES.create,
    ROUTES.pricing,
    ROUTES.howItWorks,
    ROUTES.templates,
    ROUTES.faq,
    ROUTES.contact,
    ROUTES.privacy,
    ROUTES.terms,
    ROUTES.refundPolicy,
    ROUTES.aiDisclaimer,
    ROUTES.atsDisclaimer,
  ] as const;

  const now = new Date();

  return paths.map((path) => ({
    url: new URL(path, base).toString(),
    lastModified: now,
    changeFrequency:
      path === ROUTES.home || path === ROUTES.create ? ("weekly" as const) : ("monthly" as const),
    priority: path === ROUTES.home ? 1 : path === ROUTES.create ? 0.9 : 0.7,
  }));
}

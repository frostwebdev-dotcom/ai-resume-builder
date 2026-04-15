import type { MetadataRoute } from "next";

import { ROUTES } from "@/lib/constants";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const paths = [
    ROUTES.home,
    ROUTES.pricing,
    ROUTES.howItWorks,
    ROUTES.templates,
    ROUTES.faq,
    ROUTES.contact,
    ROUTES.privacy,
    ROUTES.terms,
  ] as const;

  const now = new Date();

  return paths.map((path) => ({
    url: new URL(path, base).toString(),
    lastModified: now,
    changeFrequency: path === ROUTES.home ? ("weekly" as const) : ("monthly" as const),
    priority: path === ROUTES.home ? 1 : 0.7,
  }));
}

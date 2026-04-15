import { APP_NAME } from "@/lib/constants";

const TAGLINE =
  "Create a professional ATS-friendly resume in minutes. Preview free — pay only to export your PDF.";

type GraphEntity = Record<string, unknown>;

function buildGraph(baseUrl: string): GraphEntity {
  const origin = baseUrl.replace(/\/$/, "");
  const orgId = `${origin}/#organization`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": orgId,
        name: APP_NAME,
        url: origin,
        description: TAGLINE,
      },
      {
        "@type": "WebApplication",
        name: APP_NAME,
        url: origin,
        description: TAGLINE,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Any",
        browserRequirements: "Requires JavaScript.",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          description: "Free preview; pay per PDF export when you are ready.",
          url: `${origin}/pricing`,
        },
        publisher: { "@id": orgId },
      },
    ],
  };
}

export function HomeJsonLd() {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
  const json = JSON.stringify(buildGraph(base));

  return (
    <script
      type="application/ld+json"
      // Safe: built from constants + env URL only
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * pdf-parse v2 loads `pdfjs-dist` + `@napi-rs/canvas` via Node `require`. Bundling them
   * breaks native resolution and PDF.js canvas polyfills (DOMMatrix, etc.).
   */
  serverExternalPackages: ["pdf-parse", "pdfjs-dist", "@napi-rs/canvas"],
  /**
   * Dev-only: allow HMR / `/_next/*` when the app is opened on `localhost` but assets
   * connect from `127.0.0.1` (or the reverse). See:
   * https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins
   */
  allowedDevOrigins: ["127.0.0.1"],
  experimental: {
    /** Guest résumé upload → AI import (PDF/DOCX base64 in server action body). */
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;

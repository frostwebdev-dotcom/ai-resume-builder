import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Dev-only: allow HMR / `/_next/*` when the app is opened on `localhost` but assets
   * connect from `127.0.0.1` (or the reverse). See:
   * https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins
   */
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;

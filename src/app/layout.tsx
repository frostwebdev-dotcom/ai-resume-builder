import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import Script from "next/script";

import { AppProviders } from "@/components/providers/app-providers";
import { APP_NAME } from "@/lib/constants";

import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  title: {
    default: APP_NAME,
    template: `%s · ${APP_NAME}`,
  },
  description:
    "Create a professional ATS-friendly resume in minutes. Preview free — pay only to export your PDF.",
};

const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim() || "AW-18476637000";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} h-full min-h-dvh antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-0 min-h-dvh min-w-0 flex-col bg-background text-foreground">
        {GOOGLE_ADS_ID ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-ads-tag" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                window.gtag = gtag;
                gtag('js', new Date());
                gtag('config', '${GOOGLE_ADS_ID}');
              `}
            </Script>
          </>
        ) : null}
        <AppProviders>
          {/* Flex pass-through so nested `flex-1 min-h-0` shells (e.g. app studio) get a bounded height */}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-clip">{children}</div>
        </AppProviders>
      </body>
    </html>
  );
}

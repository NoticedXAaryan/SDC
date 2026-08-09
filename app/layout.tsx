import type { Metadata } from "next";
import "./globals.css";
import { CookieBanner } from "@/components/global/cookie-banner";
import { PostHogProvider } from "@/components/providers/posthog-provider";
import { PostHogPageView } from "@/components/providers/posthog-pageview";
import { PostHogIdentify } from "@/components/providers/posthog-identify";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AstryxProvider } from "@/components/providers/astryx-provider";
import { Toaster } from "sonner";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Student Developer Club | Parul University",
  description: "Parul University's Student Developer Club — events, projects, certificates, and community.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="font-sans h-full antialiased"
      suppressHydrationWarning
      data-astryx-theme="astryx"
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
            attribute="data-astryx-media"
            defaultTheme="system"
            enableSystem

        >
          <PostHogProvider>
            <PostHogIdentify />
            <Suspense fallback={null}>
              <PostHogPageView />
            </Suspense>
            <AstryxProvider>
              {children}
            </AstryxProvider>
            <CookieBanner />
          </PostHogProvider>
          <Toaster position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}

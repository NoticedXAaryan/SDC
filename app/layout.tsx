import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CookieBanner } from "@/components/global/cookie-banner";
import { PostHogProvider } from "@/components/providers/posthog-provider";
import { PostHogPageView } from "@/components/providers/posthog-pageview";
import { PostHogIdentify } from "@/components/providers/posthog-identify";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "sonner";
import { Suspense } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SDC OS | Student Developer Club",
  description: "The operating system for student clubs. Manage members, events, certificates, and finances.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
          <PostHogProvider>
            <PostHogIdentify />
            <Suspense fallback={null}>
              <PostHogPageView />
            </Suspense>
            {children}
            <CookieBanner />
          </PostHogProvider>
          <Toaster position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "@fontsource-variable/inter/wght.css";
import { Providers } from "@/components/providers";
import "./globals.css";
import "./club.css";

export const metadata: Metadata = {
  title: {
    default: "Student Developer Club | Parul University",
    template: "%s | SDC",
  },
  description:
    "The official platform of the Student Developer Club at Parul University. Manage events, projects, certificates, and club operations.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

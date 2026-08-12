import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "API Server",
  description: "Secure API Server for SDC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}

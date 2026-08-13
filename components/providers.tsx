"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange={false}
    >
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: "!bg-card !text-card-foreground !border-border",
        }}
        richColors
        closeButton
      />
    </ThemeProvider>
  );
}

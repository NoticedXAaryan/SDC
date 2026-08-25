import Link from "next/link";

import { SiteFooter } from "@/components/landing/SiteFooter";
import { getCurrentUser } from "@/lib/dal/auth";

export default async function PublicEventsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getCurrentUser();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-background/85 backdrop-blur-xl">
        <nav
          className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6"
          aria-label="Public navigation"
        >
          <Link href="/" className="font-semibold tracking-tight">
            Student Developer Club
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/events" aria-current="page" className="hover:text-primary">
              Events
            </Link>
            <Link href="/#highlights" className="hover:text-primary">
              Programs
            </Link>
            <Link
              href={session ? "/dashboard" : "/login"}
              className="rounded-full border border-white/15 px-4 py-2 hover:border-white/30"
            >
              {session ? "Dashboard" : "Sign in"}
            </Link>
          </div>
        </nav>
      </header>
      <main className="mx-auto min-h-[70vh] max-w-7xl px-4 py-10 sm:px-6">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}

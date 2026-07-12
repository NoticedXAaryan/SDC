import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-4xl space-y-6">
          <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium">
            STC OS v2.1 (Trusted)
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            The operating system for student clubs.
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Manage members, track event attendance, oversee budgets, and issue verifiable certificates. Built with security, speed, and compliance from day one.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button asChild size="lg">
              <Link href="/login">Access Dashboard</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/projects">View Project Showcase</Link>
            </Button>
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-muted-foreground text-sm border-t">
        <p>
          © 2026 Student Developer Club. 
          <span className="mx-2">·</span>
          <Link href="/privacy" className="hover:underline">Privacy Policy</Link> 
          <span className="mx-2">·</span>
          <Link href="/terms" className="hover:underline">Terms of Service</Link>
        </p>
      </footer>
    </div>
  );
}

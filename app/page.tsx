import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-4xl space-y-6">
          <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium">
            SDC OS v2.1 (Trusted)
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            The operating system for student clubs.
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Manage members, track event attendance, oversee budgets, and issue verifiable certificates. Built with security, speed, and compliance from day one.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/login" className={cn(buttonVariants({ size: "lg" }))}>Access Dashboard</Link>
            <Link href="/projects" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>View Project Showcase</Link>
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

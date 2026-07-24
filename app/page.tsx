"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Calendar, Users, Award, QrCode, Shield, BarChart3, 
  Zap, Globe, ArrowRight, ChevronRight, Sparkles,
  FileText, CreditCard, Target, MessageSquare,
  Lock, Activity, Layers
} from "lucide-react";

function FeatureCard({ icon: Icon, title, description }: { 
  icon: React.ElementType; 
  title: string; 
  description: string;
}) {
  return (
    <div className="group relative rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 transition-all duration-300 hover:border-foreground/20 hover:shadow-lg hover:shadow-foreground/5 hover:-translate-y-1">
      <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-foreground/5 transition-colors group-hover:bg-foreground/10">
        <Icon className="h-5 w-5 text-foreground/70" />
      </div>
      <h3 className="mb-2 text-lg font-semibold tracking-tight">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl md:text-4xl font-bold tracking-tight">{value}</div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function NavBar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background font-bold text-sm">
            S
          </div>
          <span className="font-semibold tracking-tight">SDC OS</span>
          <span className="ml-2 rounded-full border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            v2.1
          </span>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <Link href="/projects" className="transition-colors hover:text-foreground">Projects</Link>
          <Link href="/recruitment/apply" className="transition-colors hover:text-foreground">Join Us</Link>
          <Link href="/privacy" className="transition-colors hover:text-foreground">Privacy</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link 
            href="/login" 
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-sm")}
          >
            Sign in
          </Link>
          <Link 
            href="/login" 
            className={cn(buttonVariants({ size: "sm" }), "text-sm")}
          >
            Dashboard
            <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <NavBar />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
        
        <div className="relative mx-auto max-w-7xl px-4 md:px-6 py-24 md:py-36 lg:py-44">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/50 px-4 py-1.5 text-sm transition-colors hover:bg-muted">
              <Sparkles className="h-3.5 w-3.5 text-foreground/60" />
              <span className="text-muted-foreground">Built for student clubs that mean business</span>
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
              The operating system
              <br />
              <span className="text-muted-foreground">for student clubs.</span>
            </h1>
            
            <p className="mt-6 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Manage members, track event attendance, oversee budgets, issue verifiable certificates, and run recruitment — all from one platform. Built with security, speed, and compliance from day one.
            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/login" 
                className={cn(
                  buttonVariants({ size: "lg" }), 
                  "text-base px-8 h-12 rounded-xl shadow-lg shadow-foreground/10 transition-all hover:shadow-xl hover:shadow-foreground/15"
                )}
              >
                Access Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link 
                href="/projects" 
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }), 
                  "text-base px-8 h-12 rounded-xl"
                )}
              >
                View Projects
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-border/40 bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 md:px-6 py-12 md:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            <StatCard value="150+" label="Active Members" />
            <StatCard value="50+" label="Events Hosted" />
            <StatCard value="500+" label="Certificates Issued" />
            <StatCard value="99.9%" label="Uptime" />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
              <Layers className="h-3 w-3" />
              Platform
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Everything your club needs.
              <br />
              <span className="text-muted-foreground">Nothing it doesn&apos;t.</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              A complete toolkit designed for the unique needs of student technical clubs.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FeatureCard 
              icon={Calendar}
              title="Event Management"
              description="Create events, track RSVPs, manage multi-session workshops, and monitor attendance in real time."
            />
            <FeatureCard 
              icon={Users}
              title="Member Directory"
              description="Role-based access control with granular permissions. Admins, leads, members — everyone gets exactly what they need."
            />
            <FeatureCard 
              icon={QrCode}
              title="QR Check-in"
              description="HMAC-signed rotating QR passes for fast, secure event check-ins. Works offline with local validation."
            />
            <FeatureCard 
              icon={Award}
              title="Certificates"
              description="Design custom certificate templates, auto-generate for attendees, and issue verifiable PDF certificates."
            />
            <FeatureCard 
              icon={Target}
              title="Recruitment Pipeline"
              description="Application forms, AI-assisted grading, interview scheduling, and applicant tracking — built for scale."
            />
            <FeatureCard 
              icon={CreditCard}
              title="Finance & Budget"
              description="Track expenses, manage budgets, approve procurement requests, and maintain full financial transparency."
            />
            <FeatureCard 
              icon={MessageSquare}
              title="Communications"
              description="Announcements, email broadcasts, and notifications. Keep everyone in the loop without the noise."
            />
            <FeatureCard 
              icon={BarChart3}
              title="Analytics & Leaderboard"
              description="Member engagement scores, event attendance trends, and a gamified points system to drive participation."
            />
            <FeatureCard 
              icon={Shield}
              title="Security First"
              description="Rate limiting, CSRF protection, input validation, audit logs, and encrypted sessions. Production-grade security."
            />
          </div>
        </div>
      </section>

      {/* Architecture Section */}
      <section className="border-y border-border/40 bg-muted/20 py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
                <Zap className="h-3 w-3" />
                Architecture
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
                Built on a modern,
                <br />
                <span className="text-muted-foreground">production-grade stack.</span>
              </h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Next.js 16 with App Router, PostgreSQL with Drizzle ORM, Better Auth for sessions, BullMQ for background jobs, and Docker for deployment. No compromises.
              </p>
              <div className="space-y-4">
                {[
                  { icon: Globe, label: "Next.js 16 App Router", detail: "Server components, streaming, standalone output" },
                  { icon: Lock, label: "Better Auth", detail: "Email/password + Google OAuth, role-based access" },
                  { icon: Activity, label: "BullMQ + Redis", detail: "Async email, certificates, AI grading" },
                  { icon: FileText, label: "Drizzle ORM", detail: "Type-safe queries, zero-overhead migrations" },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-3 p-3 rounded-lg transition-colors hover:bg-muted/50">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-foreground/5">
                      <item.icon className="h-4 w-4 text-foreground/60" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">{item.label}</div>
                      <div className="text-xs text-muted-foreground">{item.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="rounded-xl border border-border/50 bg-card p-6 shadow-2xl shadow-foreground/5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-3 w-3 rounded-full bg-foreground/10" />
                  <div className="h-3 w-3 rounded-full bg-foreground/10" />
                  <div className="h-3 w-3 rounded-full bg-foreground/10" />
                  <span className="ml-2 text-xs text-muted-foreground font-mono">terminal</span>
                </div>
                <div className="space-y-2 font-mono text-xs">
                  <div className="text-muted-foreground">$ docker compose up --build</div>
                  <div className="text-green-600 dark:text-green-400">✓ redis started (healthy)</div>
                  <div className="text-green-600 dark:text-green-400">✓ migrator completed</div>
                  <div className="text-green-600 dark:text-green-400">✓ app listening on :3000</div>
                  <div className="text-green-600 dark:text-green-400">✓ worker processing 7 queues</div>
                  <div className="mt-3 text-muted-foreground">$ curl localhost:3000/api/health</div>
                  <div className="text-foreground">{`{ "status": "ok", "db": "connected", "redis": "connected" }`}</div>
                </div>
              </div>
              {/* Decorative gradient */}
              <div className="absolute -z-10 -inset-4 rounded-2xl bg-gradient-to-br from-foreground/5 via-transparent to-foreground/5 blur-xl" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-4 md:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Ready to run your club
            <br />
            <span className="text-muted-foreground">like a real organization?</span>
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join Student Developer Club and get access to the full platform. Apply for membership or sign in if you already have an account.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/recruitment/apply" 
              className={cn(
                buttonVariants({ size: "lg" }), 
                "text-base px-8 h-12 rounded-xl shadow-lg shadow-foreground/10"
              )}
            >
              Apply for Membership
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link 
              href="/login" 
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }), 
                "text-base px-8 h-12 rounded-xl"
              )}
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-background font-bold text-xs">
                  S
                </div>
                <span className="font-semibold text-sm">SDC OS</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The operating system for student clubs. Built by students, for students.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Platform</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link></li>
                <li><Link href="/projects" className="text-muted-foreground hover:text-foreground transition-colors">Projects</Link></li>
                <li><Link href="/recruitment/apply" className="text-muted-foreground hover:text-foreground transition-colors">Join Us</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Stack</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Next.js 16</li>
                <li>PostgreSQL</li>
                <li>Astryx UI</li>
                <li>Dokploy</li>
              </ul>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <p>© 2026 Student Developer Club, Parul University.</p>
            <p>Powered by SDC OS · Built with Astryx</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

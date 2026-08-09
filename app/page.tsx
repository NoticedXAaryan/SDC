"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Calendar, Users, Award, QrCode, Shield, BarChart3, 
  Zap, Globe, ArrowRight, Sparkles,
  FileText, CreditCard, Target, MessageSquare,
  Lock, Activity, Layers, Rocket, Code, Laptop
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
          <span className="font-semibold tracking-tight">SDC</span>
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

      {/* Cosmic Hero Section */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center justify-center">
        {/* Deep space background elements */}
        <div className="absolute inset-0 bg-background" />
        
        {/* Comet-style Celestial Gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] mix-blend-screen pointer-events-none" />
        <div className="absolute top-2/3 right-1/3 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />

        {/* Orbital/Blackhole Motifs */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-primary/10 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] border border-primary/5 rounded-full border-dashed opacity-50 animate-[spin_120s_linear_infinite]" />
        
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
        
        <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-6 py-24 md:py-36">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-[1.05] text-transparent bg-clip-text bg-gradient-to-b from-foreground to-foreground/50">
              Where developers
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-400 to-orange-400">become builders.</span>
            </h1>
            
            <p className="mt-8 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-light">
              Join Parul University's most active community of developers, designers, and innovators. Participate in hands-on workshops, build real-world projects, and connect with peers who share your passion.
            </p>
            
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link 
                href="/recruitment/apply" 
                className={cn(
                  buttonVariants({ size: "lg" }), 
                  "relative group overflow-hidden text-base px-10 h-14 rounded-full shadow-[0_0_30px_-5px_var(--color-primary)] transition-all hover:shadow-[0_0_40px_-5px_var(--color-primary)] hover:-translate-y-0.5"
                )}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-blue-600 opacity-90 transition-opacity group-hover:opacity-100" />
                <span className="relative z-10 flex items-center">
                  Apply to Join
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
              <Link 
                href="/events" 
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }), 
                  "text-base px-10 h-14 rounded-full border-border/50 bg-background/50 backdrop-blur-md transition-all hover:bg-muted/80 hover:border-border"
                )}
              >
                See Our Events
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-border/40 bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 md:px-6 py-12 md:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            <StatCard value="200+" label="Active Members" />
            <StatCard value="50+" label="Events Hosted" />
            <StatCard value="50+" label="Projects Built" />
            <StatCard value="∞" label="Lines of Code" />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              More than just a club.
              <br />
              <span className="text-muted-foreground">A place to grow.</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              We provide the resources, community, and guidance you need to kickstart your tech career.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FeatureCard 
              icon={Laptop}
              title="Workshops & Events"
              description="Attend weekly hands-on sessions, hackathons, and guest talks from industry professionals. Learn by doing."
            />
            <FeatureCard 
              icon={Code}
              title="Build Projects"
              description="Team up with other members to build real-world applications. Submit your work to our project showcase."
            />
            <FeatureCard 
              icon={Users}
              title="Community & Networking"
              description="Connect with like-minded students, find mentors, and collaborate on ideas that matter."
            />
            <FeatureCard 
              icon={Award}
              title="Certificates"
              description="Earn verifiable certificates for attending workshops, completing projects, and contributing to the club."
            />
            <FeatureCard 
              icon={Target}
              title="Join a Domain"
              description="Apply to be part of specialized teams: Web Dev, AI/ML, Design, Marketing, and more. Master your craft."
            />
            <FeatureCard 
              icon={Rocket}
              title="Launch Your Career"
              description="Get resume reviews, interview prep, and exclusive opportunities passed down from our alumni network."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border/40 py-20 md:py-28 bg-muted/20">
        <div className="mx-auto max-w-3xl px-4 md:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Ready to build
            <br />
            <span className="text-muted-foreground">something amazing?</span>
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Applications are open for the next cohort. Join us to learn, build, and connect with the best developers on campus.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/recruitment/apply" 
              className={cn(
                buttonVariants({ size: "lg" }), 
                "text-base px-8 h-12 rounded-xl shadow-lg shadow-foreground/10"
              )}
            >
              Apply Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link 
              href="/login" 
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }), 
                "text-base px-8 h-12 rounded-xl"
              )}
            >
              Member Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-background">
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-background font-bold text-xs">
                  S
                </div>
                <span className="font-semibold text-sm">SDC</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Parul University's community for developers, designers, and builders.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Explore</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/events" className="text-muted-foreground hover:text-foreground transition-colors">Events</Link></li>
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
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Members</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">Dashboard Login</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <p>© 2026 Student Developer Club, Parul University.</p>
            <p className="flex items-center gap-1">Built with <span className="text-red-500">♥</span> by SDC members</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

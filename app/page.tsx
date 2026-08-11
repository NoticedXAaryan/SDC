"use client";

import Link from "next/link";
import { AppShell } from "@astryxdesign/core";
import { TopNav, TopNavHeading, TopNavItem } from "@astryxdesign/core/TopNav";
import { NavIcon } from "@astryxdesign/core/NavIcon";
import { Button } from "@astryxdesign/core/Button";
import { VStack, Stack } from "@astryxdesign/core/Stack";
import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { useEffect, useRef, useState } from "react";
import { 
  Users, Award, 
  Code, Target, Rocket,
  ArrowRight, Heart,
  Calendar, Shield, Zap, Star
} from "lucide-react";

/* ─── Brand Icons (not available in lucide-react v1.24+) ─── */
function GithubIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  );
}

/* ─── Animated Counter ─── */
function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const duration = 2000;
          const steps = 60;
          const increment = target / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(Math.floor(current));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{count}{suffix}</span>;
}

/* ─── Scroll Reveal Wrapper ─── */
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      {children}
    </div>
  );
}

/* ─── Feature Card ─── */
function FeatureCard({ icon: IconComponent, title, description, index }: { 
  icon: React.ElementType; 
  title: string; 
  description: string;
  index: number;
}) {
  return (
    <Reveal delay={index * 100}>
      <Card variant="muted" padding={6} className="group h-full transition-all duration-300 hover:bg-foreground/[0.04] hover:shadow-[0_0_40px_-12px_rgba(128,90,213,0.15)]">
        <VStack gap={4}>
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 transition-all duration-300 group-hover:from-primary/25 group-hover:to-primary/10 group-hover:scale-110">
            <IconComponent className="h-5 w-5 text-primary/80 group-hover:text-primary transition-colors" />
          </div>
          <VStack gap={2}>
            <Heading level={4} className="text-base font-semibold tracking-tight">{title}</Heading>
            <Text type="supporting" className="text-sm leading-relaxed">{description}</Text>
          </VStack>
        </VStack>
      </Card>
    </Reveal>
  );
}

/* ─── Stat Card ─── */
function StatCard({ value, label, suffix = "+" }: { value: number; label: string; suffix?: string }) {
  return (
    <VStack gap={1} align="center">
      <Heading level={2} className="text-3xl md:text-4xl font-bold tabular-nums">
        <AnimatedCounter target={value} suffix={suffix} />
      </Heading>
      <Text type="supporting" className="text-sm font-medium tracking-wide uppercase">{label}</Text>
    </VStack>
  );
}

/* ─── Floating Particles (Stars) ─── */
function StarField() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {Array.from({ length: 40 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-foreground/20"
          style={{
            width: `${Math.random() * 2 + 1}px`,
            height: `${Math.random() * 2 + 1}px`,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animation: `star-twinkle ${3 + Math.random() * 4}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Main Landing Page ─── */
export default function Home() {
  return (
    <>
      {/* Global keyframe styles for animations */}
      <style jsx global>{`
        @keyframes star-twinkle {
          0%, 100% { opacity: 0.1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.5); }
        }
        @keyframes orbit-slow {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes orbit-reverse {
          from { transform: translate(-50%, -50%) rotate(360deg); }
          to { transform: translate(-50%, -50%) rotate(0deg); }
        }
        @keyframes float-gentle {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.3; }
        }
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      <AppShell
        variant="surface"
        contentPadding={0}
        topNav={
          <TopNav
            label="SDC Main Navigation"
            heading={
              <TopNavHeading
                heading="SDC"
                logo={
                  <NavIcon icon={<div className="font-bold text-sm bg-foreground text-background w-full h-full flex items-center justify-center rounded-lg">S</div>} />
                }
                href="/"
              />
            }
            centerContent={
              <>
                <TopNavItem label="Projects" href="/projects" />
                <TopNavItem label="Join Us" href="/recruitment/apply" />
                <TopNavItem label="Events" href="/events" />
              </>
            }
            endContent={
              <>
                <Button label="Sign in" variant="ghost" href="/login" />
                <Button
                  label="Dashboard"
                  variant="primary"
                  href="/login"
                  endContent={<ArrowRight className="h-4 w-4" />}
                />
              </>
            }
          />
        }
      >
        <VStack gap={0} className="w-full">
          
          {/* ═══════════════ COSMIC HERO SECTION ═══════════════ */}
          <div className="relative overflow-hidden w-full min-h-[92vh] flex items-center justify-center py-24">
            {/* Deep space base */}
            <div className="absolute inset-0 bg-background" />
            
            {/* Star field */}
            <StarField />
            
            {/* Celestial gradient nebula effects */}
            <div 
              className="absolute top-1/4 left-1/2 w-[700px] h-[700px] rounded-full blur-[140px] pointer-events-none"
              style={{ 
                background: "radial-gradient(circle, oklch(0.5 0.15 300 / 0.2), transparent 70%)",
                animation: "pulse-glow 8s ease-in-out infinite",
                transform: "translate(-50%, -50%)"
              }}
            />
            <div 
              className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none"
              style={{ 
                background: "radial-gradient(circle, oklch(0.5 0.12 250 / 0.12), transparent 70%)",
                animation: "pulse-glow 10s ease-in-out infinite 2s"
              }}
            />
            <div 
              className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] rounded-full blur-[130px] pointer-events-none"
              style={{ 
                background: "radial-gradient(circle, oklch(0.6 0.1 30 / 0.08), transparent 70%)",
                animation: "pulse-glow 12s ease-in-out infinite 4s"
              }}
            />

            {/* Orbital rings */}
            <div 
              className="absolute top-1/2 left-1/2 w-[600px] h-[600px] border border-foreground/[0.04] rounded-full pointer-events-none"
              style={{ animation: "orbit-slow 80s linear infinite" }}
            />
            <div 
              className="absolute top-1/2 left-1/2 w-[900px] h-[900px] border border-dashed border-foreground/[0.03] rounded-full pointer-events-none"
              style={{ animation: "orbit-reverse 120s linear infinite" }}
            />
            <div 
              className="absolute top-1/2 left-1/2 w-[1200px] h-[1200px] border border-foreground/[0.02] rounded-full pointer-events-none"
              style={{ animation: "orbit-slow 160s linear infinite" }}
            />

            {/* Small orbital dot accent */}
            <div 
              className="absolute top-1/2 left-1/2 w-[600px] h-[600px] pointer-events-none"
              style={{ animation: "orbit-slow 80s linear infinite" }}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary/40 shadow-[0_0_12px_3px] shadow-primary/20" />
            </div>
            <div 
              className="absolute top-1/2 left-1/2 w-[900px] h-[900px] pointer-events-none"
              style={{ animation: "orbit-reverse 120s linear infinite" }}
            >
              <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-400/30 shadow-[0_0_8px_2px] shadow-blue-400/15" />
            </div>
            
            {/* Bottom fade to next section */}
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent pointer-events-none" />
            
            {/* Hero content */}
            <VStack gap={8} align="center" className="max-w-[1200px] mx-auto relative z-10 px-4 md:px-6 text-center">
              <Reveal>
                <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-foreground/[0.03] px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  Now accepting applications
                </div>
              </Reveal>
              
              <Reveal delay={100}>
                <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-[-0.04em] leading-[1.05] max-w-4xl">
                  <span className="text-transparent bg-clip-text bg-gradient-to-b from-foreground via-foreground to-foreground/40">
                    Where developers
                  </span>
                  <br />
                  <span 
                    className="text-transparent bg-clip-text"
                    style={{ 
                      backgroundImage: "linear-gradient(135deg, oklch(0.65 0.15 300), oklch(0.6 0.15 250), oklch(0.7 0.12 30))",
                      backgroundSize: "200% 200%",
                      animation: "gradient-shift 6s ease infinite"
                    }}
                  >
                    become builders.
                  </span>
                </h1>
              </Reveal>
              
              <Reveal delay={200}>
                <Text type="supporting" className="text-lg md:text-xl max-w-2xl font-light leading-relaxed">
                  Join Parul University&apos;s most active community of developers, designers, and innovators. 
                  Participate in hands-on workshops, build real-world projects, and connect with peers who share your passion.
                </Text>
              </Reveal>
              
              <Reveal delay={300}>
                <Stack direction="horizontal" gap={4} className="mt-2 flex-wrap justify-center">
                  <Button 
                    label="Apply to Join" 
                    variant="primary" 
                    size="lg" 
                    href="/recruitment/apply"
                    endContent={<ArrowRight className="h-5 w-5" />}
                  />
                  <Button 
                    label="Explore Events" 
                    variant="secondary" 
                    size="lg" 
                    href="/events"
                  />
                </Stack>
              </Reveal>
            </VStack>
          </div>

          {/* ═══════════════ STATS SECTION ═══════════════ */}
          <div className="w-full border-y border-border/40 bg-foreground/[0.02] py-14 md:py-18">
            <div className="max-w-[1200px] mx-auto px-4 md:px-6">
              <Reveal>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
                  <StatCard value={200} label="Active Members" />
                  <StatCard value={50} label="Events Hosted" />
                  <StatCard value={50} label="Projects Built" />
                  <StatCard value={6} label="Tech Domains" suffix="" />
                </div>
              </Reveal>
            </div>
          </div>

          {/* ═══════════════ FEATURES GRID ═══════════════ */}
          <div className="w-full py-24 md:py-32">
            <VStack gap={10} className="max-w-[1200px] mx-auto px-4 md:px-6">
              <Reveal>
                <VStack gap={4} align="center" className="text-center max-w-2xl mx-auto">
                  <Heading level={2} className="text-3xl md:text-4xl font-bold tracking-[-0.03em]">
                    More than just a club.
                    <br />
                    <span className="text-muted-foreground font-normal">A launchpad for your career.</span>
                  </Heading>
                  <Text type="supporting" className="text-base md:text-lg leading-relaxed">
                    We provide the resources, community, and guidance you need to go from student to industry-ready developer.
                  </Text>
                </VStack>
              </Reveal>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <FeatureCard 
                  icon={Calendar}
                  title="Workshops & Events"
                  description="Attend weekly hands-on sessions, hackathons, and guest talks from industry professionals. Real skills, not just theory."
                  index={0}
                />
                <FeatureCard 
                  icon={Code}
                  title="Build Real Projects"
                  description="Team up with other members to build real-world applications. Submit your work to our public project showcase."
                  index={1}
                />
                <FeatureCard 
                  icon={Users}
                  title="Community & Mentorship"
                  description="Connect with like-minded students, find mentors, and collaborate on ideas that matter to you."
                  index={2}
                />
                <FeatureCard 
                  icon={Award}
                  title="Verifiable Certificates"
                  description="Earn blockchain-verifiable certificates for workshops, projects, and contributions. Share them on LinkedIn."
                  index={3}
                />
                <FeatureCard 
                  icon={Target}
                  title="Join a Domain"
                  description="Apply to specialized teams: Web Dev, AI/ML, Design, Marketing, Finance, and more. Master your craft with focused practice."
                  index={4}
                />
                <FeatureCard 
                  icon={Rocket}
                  title="Launch Your Career"
                  description="Get resume reviews, interview prep, and exclusive opportunities from our alumni network across the industry."
                  index={5}
                />
              </div>
            </VStack>
          </div>

          {/* ═══════════════ SOCIAL PROOF / WHY JOIN ═══════════════ */}
          <div className="w-full border-y border-border/40 bg-foreground/[0.02] py-24 md:py-32">
            <div className="max-w-[1200px] mx-auto px-4 md:px-6">
              <Reveal>
                <VStack gap={10} align="center" className="text-center">
                  <VStack gap={4} className="max-w-2xl mx-auto">
                    <Heading level={2} className="text-3xl md:text-4xl font-bold tracking-[-0.03em]">
                      Built by students,
                      <br />
                      <span className="text-muted-foreground font-normal">for students.</span>
                    </Heading>
                    <Text type="supporting" className="text-base md:text-lg leading-relaxed">
                      Everything we do is designed to bridge the gap between classroom learning and real-world skills.
                    </Text>
                  </VStack>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
                    <Reveal delay={0}>
                      <VStack gap={3} align="center" className="p-6">
                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                          <Shield className="h-6 w-6 text-primary/80" />
                        </div>
                        <Text weight="semibold" className="text-base">Trusted Platform</Text>
                        <Text type="supporting" className="text-sm text-center">
                          Secure, privacy-first infrastructure with RBAC, audit logging, and GDPR compliance built in.
                        </Text>
                      </VStack>
                    </Reveal>
                    <Reveal delay={100}>
                      <VStack gap={3} align="center" className="p-6">
                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                          <Zap className="h-6 w-6 text-primary/80" />
                        </div>
                        <Text weight="semibold" className="text-base">Always Shipping</Text>
                        <Text type="supporting" className="text-sm text-center">
                          Our platform evolves weekly with new features, improvements, and tools built by our own members.
                        </Text>
                      </VStack>
                    </Reveal>
                    <Reveal delay={200}>
                      <VStack gap={3} align="center" className="p-6">
                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                          <Star className="h-6 w-6 text-primary/80" />
                        </div>
                        <Text weight="semibold" className="text-base">Recognition System</Text>
                        <Text type="supporting" className="text-sm text-center">
                          Earn points, climb the leaderboard, and unlock achievements as you contribute to the community.
                        </Text>
                      </VStack>
                    </Reveal>
                  </div>
                </VStack>
              </Reveal>
            </div>
          </div>

          {/* ═══════════════ CTA SECTION ═══════════════ */}
          <div className="relative w-full py-24 md:py-32 overflow-hidden">
            {/* Subtle cosmic accent in background */}
            <div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full blur-[160px] pointer-events-none"
              style={{ background: "radial-gradient(circle, oklch(0.5 0.12 300 / 0.08), transparent 70%)" }}
            />
            
            <Reveal>
              <VStack gap={6} align="center" className="max-w-[1200px] mx-auto px-4 md:px-6 text-center relative z-10">
                <Heading level={2} className="text-3xl md:text-5xl font-bold tracking-[-0.03em]">
                  Ready to build
                  <br />
                  <span className="text-muted-foreground font-normal">something amazing?</span>
                </Heading>
                <Text type="supporting" className="max-w-xl text-base md:text-lg leading-relaxed">
                  Applications are open for the next cohort. Join us to learn, build, and connect with the best developers on campus.
                </Text>
                <Stack direction="horizontal" gap={4} className="mt-4 flex-wrap justify-center">
                  <Button 
                    label="Apply Now" 
                    variant="primary" 
                    size="lg" 
                    href="/recruitment/apply"
                    endContent={<ArrowRight className="h-4 w-4" />}
                  />
                  <Button 
                    label="Member Sign In" 
                    variant="secondary" 
                    size="lg" 
                    href="/login"
                  />
                </Stack>
              </VStack>
            </Reveal>
          </div>

          {/* ═══════════════ FOOTER ═══════════════ */}
          <footer className="w-full border-t border-border/40 bg-background py-12">
            <div className="max-w-[1200px] mx-auto px-4 md:px-6">
              <VStack gap={10}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  {/* Brand */}
                  <VStack gap={4} className="col-span-2 md:col-span-1">
                    <Stack direction="horizontal" gap={2} align="center">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background font-bold text-sm">
                        S
                      </div>
                      <Text weight="bold" className="text-sm tracking-tight">Student Developer Club</Text>
                    </Stack>
                    <Text type="supporting" className="text-xs leading-relaxed max-w-[200px]">
                      Parul University&apos;s community for developers, designers, and builders.
                    </Text>
                    {/* Social links */}
                    <Stack direction="horizontal" gap={3} className="mt-1">
                      <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="GitHub">
                        <GithubIcon className="h-4 w-4" />
                      </a>
                      <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="X (Twitter)">
                        <XIcon className="h-4 w-4" />
                      </a>
                      <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Instagram">
                        <InstagramIcon className="h-4 w-4" />
                      </a>
                    </Stack>
                  </VStack>

                  {/* Explore */}
                  <VStack gap={3}>
                    <Text weight="semibold" className="text-xs uppercase tracking-wider text-muted-foreground">Explore</Text>
                    <VStack gap={2}>
                      <Link href="/events" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Events</Link>
                      <Link href="/projects" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Projects</Link>
                      <Link href="/recruitment/apply" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Join Us</Link>
                      <Link href="/verify" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Verify Certificate</Link>
                    </VStack>
                  </VStack>

                  {/* Legal */}
                  <VStack gap={3}>
                    <Text weight="semibold" className="text-xs uppercase tracking-wider text-muted-foreground">Legal</Text>
                    <VStack gap={2}>
                      <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link>
                      <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link>
                    </VStack>
                  </VStack>

                  {/* Members */}
                  <VStack gap={3}>
                    <Text weight="semibold" className="text-xs uppercase tracking-wider text-muted-foreground">Members</Text>
                    <VStack gap={2}>
                      <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Dashboard Login</Link>
                      <Link href="/register" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Create Account</Link>
                    </VStack>
                  </VStack>
                </div>

                <div className="w-full border-t border-border/40 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <Text type="supporting" className="text-xs">© 2026 Student Developer Club, Parul University.</Text>
                  <Text type="supporting" className="text-xs flex items-center gap-1">
                    Built with <Heart className="h-3 w-3 text-red-500 fill-current mx-0.5" /> by SDC members
                  </Text>
                </div>
              </VStack>
            </div>
          </footer>
        </VStack>
      </AppShell>
    </>
  );
}

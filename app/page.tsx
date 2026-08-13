import { Button } from "@astryxdesign/core";
import { ArrowRight, Calendar, Code, Users } from "lucide-react";
import Link from "next/link";
import React from "react";

export const metadata = {
  title: "Student Developer Club | Parul University",
  description: "The official platform for SDC Parul University. Join us to build, learn, and innovate.",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-indigo-500/30 overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-black/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center">
              <span className="font-bold text-sm">SDC</span>
            </div>
            <span className="font-semibold text-lg tracking-tight">Student Developer Club</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-400">
            <Link href="/events" className="hover:text-white transition-colors">Events</Link>
            <Link href="/projects" className="hover:text-white transition-colors">Projects</Link>
            <Link href="/verify" className="hover:text-white transition-colors">Certificates</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-neutral-300 hover:text-white transition-colors">
              Sign In
            </Link>
            <Button href="/register" label="Join the Club" />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 flex flex-col items-center text-center">
        {/* Cosmic Background Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[500px] opacity-30 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/20 via-purple-500/10 to-transparent blur-3xl rounded-full mix-blend-screen" />
        </div>
        
        {/* Orbital rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white/5 rounded-full pointer-events-none opacity-50" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/5 rounded-full pointer-events-none opacity-40" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-indigo-500/20 rounded-full pointer-events-none opacity-60 shadow-[0_0_80px_rgba(99,102,241,0.1)]" />

        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-indigo-300 mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            Recruitments are now open for 2026
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-tight">
            Build the future at <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
              Parul University
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mb-12 leading-relaxed">
            The Student Developer Club is a community of builders, designers, and innovators. 
            We host hackathons, workshops, and build open-source projects that scale.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Button href="/register" label="Become a Member" className="w-full sm:w-auto h-12 px-8 text-base" />
            <Link 
              href="/events" 
              className="group flex items-center justify-center gap-2 w-full sm:w-auto h-12 px-8 text-base font-medium rounded-md border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
            >
              Explore Events
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-24 px-6 bg-black z-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Everything you need to grow</h2>
            <p className="text-neutral-400 max-w-xl mx-auto">
              Access resources, attend exclusive workshops, and track your progress all in one platform.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Events & Hackathons",
                description: "Register for offline and online events, scan your QR code to check in, and get your digital certificates instantly.",
                icon: Calendar,
              },
              {
                title: "Open Source Projects",
                description: "Collaborate on real-world projects with experienced mentors. Build your portfolio and GitHub profile.",
                icon: Code,
              },
              {
                title: "Vibrant Community",
                description: "Connect with like-minded peers, join specialized domains, and climb the club leaderboard.",
                icon: Users,
              }
            ].map((feature, i) => (
              <div key={i} className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors group">
                <div className="w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-indigo-400" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-neutral-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center">
              <span className="font-bold text-[10px]">SDC</span>
            </div>
            <span className="font-medium text-sm text-neutral-300">© 2026 Student Developer Club</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-neutral-500">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/dashboard" className="hover:text-white transition-colors">Member Portal</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

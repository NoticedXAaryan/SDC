import Link from "next/link";
import { ArrowLeft, Code2, Sparkles, Users2 } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
  heading?: string;
  subheading?: string;
}

const SIGNALS = [
  { icon: Code2, label: "Build in public" },
  { icon: Users2, label: "Find your people" },
  { icon: Sparkles, label: "Ship what matters" },
] as const;

export function AuthLayout({
  children,
  heading = "Welcome to SDC",
  subheading = "Parul University's Student Developer Club",
}: AuthLayoutProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#02030a] text-white selection:bg-violet-500/30">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(109,40,217,0.18),transparent_30%),radial-gradient(circle_at_82%_75%,rgba(37,99,235,0.12),transparent_26%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(circle,rgba(255,255,255,0.5)_0.6px,transparent_0.7px)] [background-size:38px_38px]" />

      <div className="relative mx-auto grid min-h-screen max-w-[1600px] lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden min-h-screen overflow-hidden border-r border-white/[0.07] p-10 lg:flex lg:flex-col xl:p-14">
          <Link href="/" className="relative z-20 inline-flex w-fit items-center gap-3 text-white">
            <span className="relative h-10 w-10 rounded-full border border-violet-300/25 bg-black shadow-[0_0_24px_rgba(124,58,237,0.4)]">
              <span className="absolute inset-[7px] rounded-full bg-black" />
              <span className="absolute inset-[4px] -rotate-12 rounded-full border-t-2 border-violet-300/80" />
            </span>
            <span>
              <span className="block text-sm font-black tracking-[0.2em]">SDC · PU</span>
              <span className="mt-0.5 block text-[10px] uppercase tracking-[0.24em] text-slate-500">Builder portal</span>
            </span>
          </Link>

          <div className="pointer-events-none absolute left-1/2 top-[43%] h-[min(40vw,570px)] w-[min(40vw,570px)] -translate-x-1/2 -translate-y-1/2">
            <div className="absolute inset-0 rounded-full border border-violet-300/[0.08]" />
            <div className="absolute inset-[13%] rounded-full border border-dashed border-blue-300/[0.09]" />
            <div className="absolute inset-[27%] rounded-full bg-violet-500/15 blur-[36px]" />
            <div className="absolute inset-[34%] rounded-full bg-black shadow-[0_0_34px_8px_rgba(124,58,237,0.42),0_0_100px_22px_rgba(37,99,235,0.16)]" />
            <div className="absolute left-[14%] right-[14%] top-1/2 h-[13%] -translate-y-1/2 -rotate-[10deg] rounded-[100%] bg-gradient-to-r from-transparent via-blue-200/70 to-violet-200/90 blur-[2px]" />
            <div className="absolute inset-[35%] rounded-full bg-black" />
          </div>

          <div className="relative z-10 my-auto max-w-lg pt-[32vh]">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-violet-300">Enter the builder orbit</p>
            <h1 className="mt-4 text-4xl font-black leading-[1.05] tracking-[-0.04em] xl:text-5xl">{heading}</h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-slate-400 xl:text-lg">{subheading}</p>
            <div className="mt-8 flex flex-wrap gap-2">
              {SIGNALS.map(({ icon: Icon, label }) => (
                <span key={label} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-semibold text-slate-300 backdrop-blur-sm">
                  <Icon size={14} className="text-violet-300" aria-hidden="true" />
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between text-xs text-slate-600">
            <span>© 2026 Student Developer Club</span>
            <span>Parul University</span>
          </div>
        </section>

        <section className="flex min-h-screen flex-col">
          <header className="flex items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-black tracking-[0.16em] text-white lg:hidden">
              <span className="h-7 w-7 rounded-full border border-violet-300/30 bg-black shadow-[0_0_16px_rgba(124,58,237,0.45)]" />
              SDC · PU
            </Link>
            <Link href="/" className="ml-auto inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-white">
              <ArrowLeft size={15} aria-hidden="true" />
              Back to home
            </Link>
          </header>

          <div className="flex flex-1 items-center justify-center px-4 pb-10 sm:px-8 lg:px-12">
            <div className="w-full max-w-[470px] rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-9">
              {children}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

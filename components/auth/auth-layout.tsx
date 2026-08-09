import Link from "next/link";

interface AuthLayoutProps {
  children: React.ReactNode;
  heading?: string;
  subheading?: string;
}

export function AuthLayout({
  children,
  heading = "Welcome to SDC",
  subheading = "Parul University's Student Developer Club",
}: AuthLayoutProps) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left panel — brand identity (Cosmic Space Theme) */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-background p-10 text-foreground border-r border-border/50">
        {/* Background decorative elements */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-20" />
        
        {/* Celestial Gradients */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] mix-blend-screen -translate-y-1/3 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[80px] mix-blend-screen translate-y-1/3 -translate-x-1/3 pointer-events-none" />

        {/* Orbital/Blackhole Motifs */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-primary/10 rounded-full pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-primary/5 rounded-full border-dashed opacity-50 animate-[spin_100s_linear_infinite] pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-foreground text-background font-bold text-lg transition-transform group-hover:scale-105 shadow-[0_0_15px_rgba(var(--foreground),0.2)]">
              S
            </div>
            <div className="flex flex-col">
              <span className="text-base font-semibold tracking-tight leading-none text-foreground">
                SDC
              </span>
              <span className="text-xs text-muted-foreground leading-tight mt-0.5">
                Student Developer Club
              </span>
            </div>
          </Link>
        </div>

        {/* Centered branding text */}
        <div className="relative z-10 flex-1 flex flex-col justify-center max-w-md">
          <h1 className="text-4xl font-bold tracking-tight leading-tight text-foreground">
            {heading}
          </h1>
          <p className="mt-4 text-muted-foreground text-lg leading-relaxed font-light">
            {subheading}
          </p>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center justify-between text-xs text-muted-foreground">
          <span>© 2026 Student Developer Club</span>
          <span>Parul University</span>
        </div>
      </div>

      {/* Right panel — form content */}
      <div className="flex flex-col">
        {/* Mobile header */}
        <div className="flex items-center justify-between p-4 lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background font-bold text-sm">
              S
            </div>
            <span className="text-sm font-semibold tracking-tight">
              SDC
            </span>
          </Link>
        </div>

        {/* Form area */}
        <div className="flex flex-1 items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-[420px]">{children}</div>
        </div>
      </div>
    </div>
  );
}

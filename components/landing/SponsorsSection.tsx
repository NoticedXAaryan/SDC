import { ExternalLink } from "lucide-react";

const PARTNERS = [
  {
    name: "Parul University Vadodara",
    href: "https://paruluniversity.ac.in/",
    mark: "PU",
  },
  {
    name: "Parul University Goa",
    href: "https://paruluniversity.ac.in/goa/",
    mark: "PU",
  },
  {
    name: "PIERC",
    href: "https://pierc.paruluniversity.ac.in/",
    mark: "PIERC",
  },
] as const;

export function SponsorsSection() {
  return (
    <section
      id="sponsors"
      aria-labelledby="partners-title"
      className="relative overflow-hidden border-y border-white/5 bg-[#03040a] py-20 tablet:py-28"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.12),transparent_38%)]" />
      <div className="site-container relative z-10">
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-violet-300">Supported by</p>
          <h2 id="partners-title" className="mt-3 text-3xl font-black tracking-tight text-white tablet:text-4xl">
            Partners in our mission
          </h2>
          <p className="mt-5 text-slate-400">Institutions helping student builders turn curiosity into capability.</p>
        </header>

        <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-4 tablet:grid-cols-3">
          {PARTNERS.map((partner) => (
            <a
              key={partner.name}
              href={partner.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex min-h-48 flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/[0.035] p-7 text-center transition-all hover:-translate-y-1 hover:border-violet-300/30 hover:bg-white/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
            >
              <div className="flex h-20 w-full items-center justify-center rounded-2xl border border-violet-300/15 bg-gradient-to-br from-violet-500/15 to-cyan-400/5 text-2xl font-black tracking-[0.16em] text-white">
                {partner.mark}
              </div>
              <span className="mt-5 inline-flex items-center gap-2 font-bold text-slate-100">
                {partner.name}
                <ExternalLink size={15} className="text-slate-500 transition-colors group-hover:text-violet-300" aria-hidden="true" />
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

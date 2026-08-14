import {
  ABOUT_DESCRIPTION,
  FESTIVAL_ORGANIZERS,
  FESTIVAL_STATISTICS,
} from "@/lib/landing/content";

export function AboutSection() {
  return (
    <section id="about" aria-labelledby="about-title" className="relative bg-blue-950 section-padding overflow-hidden">
      {/* Texture and ambient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-800/50 via-blue-950 to-slate-950"></div>
      <div className="absolute inset-0 opacity-5 mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
      
      {/* Decorative Stars Imprint */}
      <div className="absolute right-[10%] top-20 hidden desktop:flex gap-6 opacity-10 mix-blend-overlay pointer-events-none">
        <svg aria-hidden="true" width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
          <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" fill="currentColor"/>
        </svg>
        <svg aria-hidden="true" width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white mt-12">
          <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" fill="currentColor"/>
        </svg>
        <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white -mt-4">
          <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" fill="currentColor"/>
        </svg>
      </div>

      <div className="site-container relative z-10">
        <header className="max-w-3xl">
          <p className="mb-2 font-semibold uppercase tracking-widest text-amber-300">
            Our purpose
          </p>
          <h2 id="about-title" className="text-3xl font-extrabold text-white tablet:text-4xl">About the Festival</h2>
          <div aria-hidden="true" className="brand-rule mt-6 w-20 text-amber-300/50" />
          <p className="mt-6 text-lg text-blue-100/80 leading-relaxed">{ABOUT_DESCRIPTION}</p>
        </header>

        {/* Organizers */}
        <div className="mt-16 grid grid-cols-1 gap-6 desktop:grid-cols-3">
          {FESTIVAL_ORGANIZERS.map((organizer) => (
            <article
              key={organizer.name}
              className="group relative flex flex-col rounded-2xl border border-amber-300 bg-gradient-to-br from-[#FFE38B] to-[#F2B022] p-8 shadow-lg transition-colors hover:border-amber-400"
            >
              <div className="mb-8 flex h-16 items-center">
                {organizer.logoUrl ? (
                  <img src={organizer.logoUrl} alt={`${organizer.name} logo`} className="h-full w-auto object-contain" />
                ) : (
                  <h3 className="font-bold text-slate-900 text-xl">{organizer.name}</h3>
                )}
              </div>
              {organizer.logoUrl && <h3 className="sr-only">{organizer.name}</h3>}
              <p className="text-amber-950/80 font-medium leading-relaxed flex-1">{organizer.description}</p>
            </article>
          ))}
        </div>

        {/* Statistics */}
        <dl className="mt-20 grid grid-cols-2 gap-8 border-t border-blue-900/50 pt-16 tablet:grid-cols-4">
          {FESTIVAL_STATISTICS.map((stat) => (
            <div key={stat.label} className="flex flex-col gap-2 text-center tablet:text-left">
              <dt className="text-sm font-medium text-amber-300/80 uppercase tracking-wider">{stat.label}</dt>
              <dd className="text-3xl font-extrabold tracking-tight text-white">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

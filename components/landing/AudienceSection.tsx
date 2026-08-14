"use client";

import { FESTIVAL_AUDIENCES } from "@/lib/landing/content";
import { InteractiveCloud } from "./InteractiveCloud";

/**
 * "Who it's for" section — A dynamic, interactive sky with floating clouds.
 */
export function AudienceSection() {
  return (
    <section
      id="audience"
      aria-labelledby="audience-title"
      className="relative section-padding z-10"
    >
      {/* Short, smooth internal gradient fade so it seamlessly blends with the white section above */}
      <div 
        className="absolute inset-0 bg-secondary pointer-events-none -z-10"
        style={{
          maskImage: "linear-gradient(to bottom, transparent 0%, black 150px, black calc(100% - 150px), transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 150px, black calc(100% - 150px), transparent 100%)"
        }}
      >
        {/* Extremely subtle noise texture overlay */}
        <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none" style={{ willChange: "transform", transform: "translateZ(0)" }} />
      </div>

      {/* Decorative background clouds (purely visual) */}
      <div className="absolute top-10 left-10 w-64 h-32 bg-white/20 rounded-full blur-3xl" style={{ willChange: "transform", transform: "translateZ(0)" }} />
      <div className="absolute top-40 right-20 w-96 h-48 bg-white/30 rounded-full blur-3xl" style={{ willChange: "transform", transform: "translateZ(0)" }} />
      <div className="absolute bottom-20 left-1/3 w-80 h-40 bg-white/20 rounded-full blur-3xl" style={{ willChange: "transform", transform: "translateZ(0)" }} />

      <div className="site-container relative z-10">
        <header className="max-w-3xl text-center mx-auto mb-20 tablet:mb-32">
          <p className="mb-3 font-black uppercase tracking-widest text-sky-200 drop-shadow-sm">
            Who it&apos;s for
          </p>
          <h2 id="audience-title" className="font-black text-4xl tablet:text-5xl text-white drop-shadow-md">
            Built for Everyone Backing Ideas
          </h2>
          <div aria-hidden="true" className="brand-rule mx-auto mt-8 w-24 border-sky-300 border-t-4" />
          <p className="mt-8 text-xl text-sky-50 font-medium max-w-2xl mx-auto drop-shadow-sm">
            Whether you are sketching your first idea or writing cheques, the
            festival is organized around what you came to get done.
          </p>
        </header>

        {/* Scattered Clouds Layout */}
        <div className="mt-8 grid grid-cols-1 gap-y-16 tablet:grid-cols-2 tablet:gap-x-8 tablet:gap-y-16 lg:gap-x-12">
          {FESTIVAL_AUDIENCES.map((audience, index) => {
            const isEven = index % 2 === 1;
            const marginTop = isEven ? "tablet:mt-16" : "";
            
            return (
              <div key={audience.id} className={`${marginTop} px-4 tablet:px-0`}>
                <InteractiveCloud 
                  audience={audience} 
                  delay={index * 0.3} 
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

import { MessageCircle, ArrowRight } from "lucide-react";

import { loadPublishedSchedule } from "@/lib/landing/schedule-loader";
import { FESTIVAL_FAQS } from "@/lib/landing/content";
import { viewerFromSession } from "@/lib/landing/auth-routing";
import { getCurrentUser } from "@/lib/dal/auth";

import { SiteHeader } from "@/components/landing/SiteHeader";
import { HeroSection } from "@/components/landing/HeroSection";
import { AboutSection } from "@/components/landing/AboutSection";
import { HighlightsSection } from "@/components/landing/HighlightsSection";
import { AudienceSection } from "@/components/landing/AudienceSection";
import { ScheduleSection } from "@/components/landing/ScheduleSection";
import { SponsorsSection } from "@/components/landing/SponsorsSection";
import { FaqAccordion } from "@/components/landing/FaqAccordion";
import { CtaBand } from "@/components/landing/CtaBand";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { MotionProvider } from "@/components/landing/MotionProvider";

export default async function Page() {
  const [scheduleResult, sessionResult] = await Promise.allSettled([
    loadPublishedSchedule(),
    getCurrentUser(),
  ]);

  const viewer = viewerFromSession(sessionResult.status === "fulfilled" ? sessionResult.value : null);

  const schedule =
    scheduleResult.status === "fulfilled"
      ? scheduleResult.value
      : { state: "unavailable" as const, events: [] as [], message: "Event data is temporarily unavailable." };

  return (
    <>
      <SiteHeader viewer={viewer} />
      <main className="bg-slate-950 text-slate-50 selection:bg-indigo-500/30">
        <HeroSection viewer={viewer} />

        <MotionProvider>
          <AboutSection />
          <HighlightsSection />
          <AudienceSection />
          <ScheduleSection schedule={schedule} />

          <SponsorsSection />

          <section
              id="faq"
              aria-labelledby="faq-title"
              className="relative overflow-hidden bg-slate-950 py-24 section-padding"
            >
              {/* Space Theme Background */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950" />

              <div className="site-container relative z-10">
                <div className="grid grid-cols-1 gap-12 desktop:grid-cols-12 desktop:gap-8">
                  <header className="desktop:col-span-5">
                    <p className="mb-3 font-bold uppercase tracking-widest text-indigo-400">
                      Got questions?
                    </p>
                    <h2 id="faq-title" className="text-4xl font-extrabold tracking-tight text-white tablet:text-5xl">
                      Frequently Asked Questions
                    </h2>
                    <div
                      aria-hidden="true"
                      className="brand-rule mt-8 w-24 border-t-2 border-indigo-500/40"
                    />
                    <p className="mt-8 max-w-md text-lg leading-relaxed text-slate-400">
                      Everything you need to know about joining and participating in SDC. Can&apos;t find your answer? Reach out to our Core Team.
                    </p>

                    <div className="mt-12 max-w-sm rounded-2xl border border-indigo-500/20 bg-slate-900/60 p-8 shadow-sm backdrop-blur-md">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400">
                        <MessageCircle size={24} aria-hidden="true" />
                      </div>
                      <h3 className="mt-6 text-xl font-bold text-white">Still have questions?</h3>
                      <p className="mt-2 text-slate-400">
                        Can&apos;t find the answer you&apos;re looking for? Please chat to our friendly Core Team.
                      </p>
                      <a href="mailto:hello@sdc.paruluniversity.ac.in" className="group mt-6 inline-flex items-center gap-2 font-semibold text-indigo-400 transition-colors hover:text-indigo-300">
                        Contact Us 
                        <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
                      </a>
                    </div>
                  </header>
                  <div className="desktop:col-span-7">
                    <FaqAccordion items={FESTIVAL_FAQS} />
                  </div>
                </div>
              </div>
            </section>

          <CtaBand viewer={viewer} />
        </MotionProvider>
      </main>
      <SiteFooter />
    </>
  );
}

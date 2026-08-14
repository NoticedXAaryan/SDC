"use client";

import { Cloud, Rocket } from "lucide-react";

/**
 * Partners section — displays the three organizing institutions.
 * Styled as a compact, vibrant blue section with rocket-themed background.
 */
export function SponsorsSection() {
  return (
    <section
      id="sponsors"
      aria-labelledby="partners-title"
      className="relative overflow-hidden bg-sky-500 py-16 tablet:py-24"
    >
      {/* Background Elements (Concentric rings) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full border-[40px] border-white/5 opacity-50 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[1000px] w-[1000px] rounded-full border-[60px] border-white/5 opacity-50 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[1400px] w-[1400px] rounded-full border-[80px] border-white/5 opacity-50 pointer-events-none" />
      
      {/* Decorative Clouds */}
      <Cloud className="absolute top-12 left-8 tablet:left-24 h-16 w-16 text-white/20" strokeWidth={1.5} aria-hidden="true" />
      <Cloud className="absolute top-24 right-8 tablet:right-32 h-24 w-24 text-white/20" strokeWidth={1.5} aria-hidden="true" />

      {/* Decorative Rocket */}
      <Rocket className="absolute bottom-12 left-1/2 -translate-x-1/2 h-48 w-48 text-white/5 -rotate-12 pointer-events-none" strokeWidth={1} aria-hidden="true" />

      {/* Wavy bottom border */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none rotate-180">
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="block h-[40px] w-full tablet:h-[60px]"
          aria-hidden="true"
        >
          <path
            d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"
            className="fill-canvas text-canvas"
            opacity=".25"
          />
          <path
            d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z"
            className="fill-canvas text-canvas"
            opacity=".5"
          />
          <path
            d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"
            className="fill-canvas text-canvas"
          />
        </svg>
      </div>

      <div className="site-container relative z-10">
        <header className="mx-auto max-w-2xl text-center">
          <h2 id="partners-title" className="text-3xl font-extrabold tracking-tight text-white drop-shadow-sm tablet:text-4xl">
            Our Partners
          </h2>
        </header>

        <div className="mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-6 tablet:grid-cols-3">
          
          {/* Parul University Vadodara */}
          <a 
            href="https://paruluniversity.ac.in/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center p-6 text-center transition-transform hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-sky-500 rounded-xl"
          >
            <img
              src="/pu-vadodara.png"
              alt="Parul University Vadodara Logo"
              className="h-20 w-auto object-contain drop-shadow-md"
              onError={(e) => { e.currentTarget.src = "/logo.png" }}
            />
            <p className="mt-5 font-bold text-white drop-shadow-sm">
              Parul University Vadodara
            </p>
          </a>

          {/* Parul University Goa */}
          <a 
            href="https://paruluniversity.ac.in/goa/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center p-6 text-center transition-transform hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-sky-500 rounded-xl"
          >
            <img
              src="/pu-goa.png"
              alt="Parul University Goa Logo"
              className="h-16 w-auto object-contain drop-shadow-md"
              onError={(e) => { e.currentTarget.src = "/logo.png" }}
            />
            <p className="mt-5 font-bold text-white drop-shadow-sm">
              Parul University Goa
            </p>
          </a>

          {/* PIERC */}
          <a 
            href="https://pierc.paruluniversity.ac.in/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center p-6 text-center transition-transform hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-sky-500 rounded-xl"
          >
            <img
              src="/pierc.png"
              alt="PIERC Logo"
              className="h-16 w-auto object-contain drop-shadow-md"
              onError={(e) => { e.currentTarget.src = "/logo.png" }}
            />
            <p className="mt-5 font-bold text-white drop-shadow-sm">
              PIERC
            </p>
          </a>
          
        </div>
      </div>
    </section>
  );
}

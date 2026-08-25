"use client";

import { motion } from "motion/react";
import Image from "next/image";
import type { Highlight } from "@/lib/landing/content/contracts";

interface InteractiveHighlightCardProps {
  highlight: Highlight;
  className?: string;
  delay?: number;
}

export function InteractiveHighlightCard({ highlight, className = "", delay = 0 }: InteractiveHighlightCardProps) {
  const Icon = highlight.icon;
  const hasImage = !!highlight.imageUrl;

  return (
    <motion.article
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 0.98 }}
      className={`group relative overflow-hidden rounded-[2rem] border p-8 transition-all hover:-translate-y-1 hover:shadow-[0_24px_80px_rgba(76,29,149,0.22)] ${
        hasImage ? "border-white/10 bg-slate-950" : "border-white/10 bg-white/[0.035]"
      } ${className}`}
      aria-label={highlight.accessibleLabel}
    >
      {/* Background Image (if present) */}
      {hasImage && (
        <>
          <div className="absolute inset-0 z-0">
            <Image 
              src={highlight.imageUrl!}
              alt={highlight.title}
              fill
              className="object-cover opacity-50 transition-opacity duration-700 group-hover:opacity-70"
            />
          </div>
          {/* Gradient Overlay for text readability */}
          <div className="absolute inset-0 z-0 bg-gradient-to-t from-ink/90 via-ink/40 to-transparent pointer-events-none" />
        </>
      )}

      {/* Animated gradient background that appears on hover (only if no image) */}
      {!hasImage && (
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-violet-500/15 via-transparent to-cyan-400/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      )}
      
      {/* Massive decorative icon in the background */}
      <div className="pointer-events-none absolute -bottom-8 -right-8 z-0 text-violet-300 opacity-[0.05] transition-all duration-500 group-hover:scale-110 group-hover:opacity-10">
        <Icon size={200} aria-hidden="true" />
      </div>

      <div className="relative z-10 flex h-full flex-col">
        <div className="mb-auto">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-300 ring-1 ring-violet-400/20 transition-all duration-500 group-hover:-translate-y-1 group-hover:bg-violet-500/20 group-hover:text-white">
            <Icon size={24} strokeWidth={2.5} role="img" aria-label={highlight.title} />
          </span>
        </div>
        
        <div className="mt-12">
          <h3 className="text-2xl font-black tracking-tight text-white transition-colors duration-300 group-hover:text-violet-200">
            {highlight.title}
          </h3>
          <p className="mt-4 text-[15px] font-medium leading-relaxed text-slate-400">
            {highlight.description}
          </p>
        </div>
      </div>
    </motion.article>
  );
}

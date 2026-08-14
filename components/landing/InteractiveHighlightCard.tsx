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
      className={`group relative overflow-hidden rounded-[2rem] border p-8 shadow-sm transition-all hover:shadow-xl ${
        hasImage ? "border-transparent bg-ink" : "bg-surface border-surface-alt"
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
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100 z-0" />
      )}
      
      {/* Massive decorative icon in the background */}
      <div className={`absolute -right-8 -bottom-8 transition-transform duration-500 group-hover:scale-110 pointer-events-none z-0 ${hasImage ? 'opacity-[0.1] text-white' : 'opacity-[0.03] text-ink group-hover:opacity-[0.06]'}`}>
        <Icon size={200} aria-hidden="true" />
      </div>

      <div className="relative z-10 flex h-full flex-col">
        <div className="mb-auto">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-canvas text-secondary shadow-sm ring-1 ring-surface-alt transition-transform duration-500 group-hover:-translate-y-1 group-hover:shadow-md group-hover:bg-secondary group-hover:text-white">
            <Icon size={24} strokeWidth={2.5} role="img" aria-label={highlight.title} />
          </span>
        </div>
        
        <div className="mt-12">
          <h3 className={`font-black text-2xl tracking-tight transition-colors duration-300 ${hasImage ? "text-white group-hover:text-sky-200" : "text-ink group-hover:text-primary"}`}>
            {highlight.title}
          </h3>
          <p className={`mt-4 text-[15px] font-medium leading-relaxed ${hasImage ? "text-white/80" : "text-ink-muted"}`}>
            {highlight.description}
          </p>
        </div>
      </div>
    </motion.article>
  );
}

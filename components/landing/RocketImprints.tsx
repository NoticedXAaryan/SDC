/**
 * Decorative animated rockets that fly across the background,
 * leaving bubbling cloud trails and bobbing up and down.
 */
"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";

function Cloud({ delay, xOffset, index }: { delay: number; xOffset: number, index: number }) {
  return (
    <motion.circle
      cx="32"
      cy="52"
      r="4"
      fill="currentColor"
      initial={{ opacity: 0, scale: 0.2, y: 0, x: 0 }}
      animate={{
        opacity: [0, 0.9, 0],
        scale: [0.2, 2.5, 4],
        y: [0, 15, 35],
        x: [0, xOffset, xOffset * 1.5],
      }}
      transition={{
        duration: 1.8,
        repeat: Infinity,
        delay,
        ease: "easeOut",
      }}
    />
  );
}

function FlyingRocket({
  startX,
  startY,
  duration,
  delay,
  scale,
  direction = "right",
}: {
  startX: number;
  startY: number;
  duration: number;
  delay: number;
  scale: number;
  direction?: "right" | "left";
}) {
  const isRight = direction === "right";
  
  // Smooth, continuous diagonal drift
  const xEnd = isRight ? "100vw" : "-100vw";
  const yEnd = "-30vh";
  
  // Angle the rocket to point in the direction of flight
  const rotation = isRight ? 45 : -45;

  return (
    <motion.div
      className="absolute text-surface pointer-events-none drop-shadow-md"
      style={{
        left: `${startX}%`,
        top: `${startY}%`,
        scale,
      }}
      initial={{ x: 0, y: 0, opacity: 0 }}
      animate={{
        x: [0, xEnd],
        y: [0, yEnd],
        opacity: [0, 0.3, 0.3, 0.3, 0.3, 0],
      }}
      transition={{
        duration,
        repeat: Infinity,
        delay,
        ease: "linear",
      }}
    >
      <motion.div
        animate={{ 
          y: [0, -15, 0, 15, 0] 
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <svg
          style={{ transform: `rotate(${rotation}deg)` }}
          viewBox="0 0 64 100"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-24 w-24 tablet:h-32 tablet:w-32"
          aria-hidden="true"
        >
          {/* Cloud Trail */}
          <Cloud index={0} delay={0} xOffset={8} />
          <Cloud index={1} delay={0.3} xOffset={-6} />
          <Cloud index={2} delay={0.6} xOffset={10} />
          <Cloud index={3} delay={0.9} xOffset={-8} />
          <Cloud index={4} delay={1.2} xOffset={5} />
          <Cloud index={5} delay={1.5} xOffset={-4} />

          {/* Rocket Body */}
          <path d="M32 4c7.2 6.6 11 15.3 11 24.6 0 5.4-1.3 10.6-3.7 15.2H24.7A33.6 33.6 0 0 1 21 28.6C21 19.3 24.8 10.6 32 4Z" fill="currentColor" fillOpacity={0.1}/>
          {/* Window */}
          <circle cx="32" cy="24" r="4.6" />
          {/* Fins */}
          <path d="M24.7 33.4c-4.6 2-7.6 6.4-7.6 11.4l7.6-3.4M39.3 33.4c4.6 2 7.6 6.4 7.6 11.4l-7.6-3.4" fill="currentColor" fillOpacity={0.1}/>
          {/* Exhaust */}
          <path d="M28.4 48.2c1.2 4 2.4 7.4 3.6 10.2 1.2-2.8 2.4-6.2 3.6-10.2" />
        </svg>
      </motion.div>
    </motion.div>
  );
}

const ROCKETS = [
  // Swarm 1: Background layers (smaller, slower)
  { id: 1, startX: -20, startY: 10, duration: 12, delay: -11, scale: 0.5, dir: "right" },
  { id: 2, startX: 110, startY: 15, duration: 15, delay: -4, scale: 0.6, dir: "left" },
  { id: 3, startX: -10, startY: 25, duration: 14, delay: -2, scale: 0.4, dir: "right" },
  { id: 4, startX: 120, startY: 5,  duration: 16, delay: -13, scale: 0.7, dir: "left" },
  { id: 17, startX: -30, startY: 35, duration: 18, delay: -7, scale: 0.5, dir: "right" },
  { id: 18, startX: 130, startY: 45, duration: 17, delay: -1, scale: 0.6, dir: "left" },
  
  // Swarm 2: Mid layers (medium size, faster)
  { id: 5, startX: 115, startY: 35, duration: 10, delay: -8, scale: 0.7, dir: "left" },
  { id: 6, startX: -30, startY: 45, duration: 11, delay: -10, scale: 0.9, dir: "right" },
  { id: 7, startX: -15, startY: 55, duration: 9, delay: -3, scale: 0.6, dir: "right" },
  { id: 8, startX: 125, startY: 50, duration: 12, delay: -14, scale: 0.8, dir: "left" },
  { id: 19, startX: -10, startY: 15, duration: 8, delay: -15, scale: 1.0, dir: "right" },
  { id: 20, startX: 105, startY: 85, duration: 10, delay: -5, scale: 0.7, dir: "left" },

  // Swarm 3: Foreground layers (larger, very fast)
  { id: 9, startX: -5,  startY: 70, duration: 7, delay: -9, scale: 0.9, dir: "right" },
  { id: 10, startX: 105, startY: 65, duration: 8, delay: -1, scale: 1.1, dir: "left" },
  { id: 11, startX: -25, startY: 85, duration: 9, delay: -12, scale: 1.3, dir: "right" },
  { id: 12, startX: 115, startY: 80, duration: 7, delay: -6, scale: 1.0, dir: "left" },
  { id: 21, startX: -20, startY: 95, duration: 6, delay: -2, scale: 1.4, dir: "right" },
  { id: 22, startX: 120, startY: 25, duration: 9, delay: -11, scale: 1.2, dir: "left" },

  // Swarm 4: Random erratic ones
  { id: 13, startX: 10,  startY: 95, duration: 10, delay: -7, scale: 0.8, dir: "right" },
  { id: 14, startX: 110, startY: 105, duration: 11, delay: -4, scale: 0.7, dir: "left" },
  { id: 15, startX: -10, startY: 115, duration: 8, delay: -13, scale: 1.1, dir: "right" },
  { id: 16, startX: 120, startY: 90, duration: 12, delay: -8, scale: 0.9, dir: "left" },
  { id: 23, startX: 30,  startY: 120, duration: 7, delay: -5, scale: 1.3, dir: "right" },
  { id: 24, startX: 90, startY: -10, duration: 10, delay: -3, scale: 0.6, dir: "left" },
] as const;

export function RocketImprints() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {ROCKETS.map((r) => (
        <FlyingRocket
          key={r.id}
          startX={r.startX}
          startY={r.startY}
          duration={r.duration}
          delay={r.delay}
          scale={r.scale}
          direction={r.dir}
        />
      ))}
    </div>
  );
}

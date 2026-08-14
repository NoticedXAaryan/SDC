/**
 * CosmicBackground — layered SVG/CSS space field.
 * Renders aria-hidden, pointer-events-none, no layout impact.
 * Variants: "public" | "auth" | "dashboard" | "scanner" | "subdued"
 *
 * Doc ref: §04 step 5 — Build as layered SVG/CSS, must have static fallback.
 */
"use client";

import React from "react";

type CosmicVariant = "public" | "auth" | "dashboard" | "scanner" | "subdued";

interface CosmicBackgroundProps {
  variant?: CosmicVariant;
  className?: string;
}

/** Star particle — purely decorative */
function StarField({ density = "normal" }: { density?: "sparse" | "normal" | "dense" }) {
  const count = density === "sparse" ? 30 : density === "dense" ? 100 : 60;
  // Deterministic star positions using a simple LCG so SSR/client match
  const stars = React.useMemo(() => {
    const result: { x: number; y: number; r: number; opacity: number; delay: number }[] = [];
    let seed = 42;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) & 0xffffffff;
      return (seed >>> 0) / 0x100000000;
    };
    for (let i = 0; i < count; i++) {
      result.push({
        x: rand() * 100,
        y: rand() * 100,
        r: 0.5 + rand() * 1.5,
        opacity: 0.3 + rand() * 0.6,
        delay: rand() * 4,
      });
    }
    return result;
  }, [count]);

  return (
    <svg
      aria-hidden="true"
      className="absolute inset-0 w-full h-full"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
    >
      {stars.map((s, i) => (
        <circle
          key={i}
          cx={s.x}
          cy={s.y}
          r={s.r}
          fill="white"
          opacity={s.opacity}
          style={{ animationDelay: `${s.delay}s` }}
          className="animate-star-twinkle"
        />
      ))}
    </svg>
  );
}

/** Orbital ring pair — decorative concentric circles */
function OrbitalRings({ reduced = false }: { reduced?: boolean }) {
  if (reduced) return null;
  return (
    <svg
      aria-hidden="true"
      className="absolute inset-0 w-full h-full"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 800 800"
      preserveAspectRatio="xMidYMid slice"
    >
      <circle
        cx="400" cy="400" r="280"
        fill="none"
        stroke="rgba(124,58,237,0.08)"
        strokeWidth="1"
      />
      <circle
        cx="400" cy="400" r="380"
        fill="none"
        stroke="rgba(124,58,237,0.05)"
        strokeWidth="1"
        strokeDasharray="4 8"
        className="animate-orbit-slow"
        style={{ transformOrigin: "400px 400px" }}
      />
    </svg>
  );
}

/** Black-hole radial well — strong brand moment */
function BlackHoleWell() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none"
      style={{
        background: `
          radial-gradient(ellipse at 65% 35%, rgba(168,85,247,0.22) 0%, transparent 50%),
          radial-gradient(ellipse at 35% 65%, rgba(59,130,246,0.12) 0%, transparent 40%),
          radial-gradient(ellipse at center, rgba(2,1,10,0.7) 10%, transparent 70%)
        `,
      }}
    />
  );
}

/** Nebula gradient — softer background glow */
function NebulaGlow({ position = "top-right" }: { position?: "top-right" | "bottom-left" | "center" }) {
  const styles: Record<string, React.CSSProperties> = {
    "top-right": {
      top: "-10%", right: "-10%", width: "50%", paddingBottom: "50%",
      background: "radial-gradient(circle, rgba(168,85,247,0.18) 0%, transparent 70%)",
    },
    "bottom-left": {
      bottom: "-10%", left: "-10%", width: "50%", paddingBottom: "50%",
      background: "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)",
    },
    "center": {
      top: "50%", left: "50%", transform: "translate(-50%,-50%)",
      width: "60%", paddingBottom: "60%",
      background: "radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)",
    },
  };

  return (
    <div
      aria-hidden="true"
      className="absolute rounded-full blur-3xl pointer-events-none"
      style={styles[position]}
    />
  );
}

export function CosmicBackground({ variant = "public", className = "" }: CosmicBackgroundProps) {
  const base = "absolute inset-0 overflow-hidden pointer-events-none z-0 " + className;

  if (variant === "scanner") {
    // Scanner pages: minimal decoration — prioritise contrast and live feedback
    return (
      <div aria-hidden="true" className={base}>
        <div className="absolute inset-0 bg-[#04020a]" />
      </div>
    );
  }

  if (variant === "subdued") {
    // Operational pages: restrained orbital lines only
    return (
      <div aria-hidden="true" className={base}>
        <div className="absolute inset-0" style={{ background: "var(--d-bg)" }} />
        <NebulaGlow position="top-right" />
      </div>
    );
  }

  if (variant === "dashboard") {
    // Authenticated workspace: restrained orbital lines, no star field
    return (
      <div aria-hidden="true" className={base}>
        <NebulaGlow position="top-right" />
        <OrbitalRings reduced={false} />
      </div>
    );
  }

  if (variant === "auth") {
    // Auth: moderate celestial field + black hole well
    return (
      <div aria-hidden="true" className={base}>
        <BlackHoleWell />
        <StarField density="sparse" />
        <OrbitalRings />
      </div>
    );
  }

  // public: strongest celestial field
  return (
    <div aria-hidden="true" className={base}>
      <BlackHoleWell />
      <StarField density="normal" />
      <OrbitalRings />
      <NebulaGlow position="bottom-left" />
    </div>
  );
}

export { StarField, OrbitalRings, BlackHoleWell, NebulaGlow };

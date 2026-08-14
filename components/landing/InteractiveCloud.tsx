"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check } from "lucide-react";
import type { AudienceGroup } from "@/lib/landing/content/audience";

interface InteractiveCloudProps {
  audience: AudienceGroup;
  delay?: number;
}

export function InteractiveCloud({ audience, delay = 0 }: InteractiveCloudProps) {
  const [isRaining, setIsRaining] = useState(false);
  const [isThundering, setIsThundering] = useState(false);
  const Icon = audience.icon;

  const [rainDrops] = useState(() => Array.from({ length: 15 }).map(() => ({
    duration: 0.5 + Math.random() * 0.4,
    delay: Math.random() * 0.3
  })));
  
  const [cloudMotion] = useState(() => ({
    duration: 5 + Math.random() * 2
  }));

  const handleClick = () => {
    if (isRaining) {
      // Thunder randomly on some clicks while raining
      if (Math.random() > 0.3) {
        setIsThundering(true);
        setTimeout(() => setIsThundering(false), 250);
      }
      return;
    }
    
    setIsRaining(true);
    setTimeout(() => {
      setIsRaining(false);
    }, 2500);
  };

  const cloudBgColor = isThundering ? "#fef08a" : isRaining ? "#64748b" : "#ffffff";

  return (
    <div className="relative w-full max-w-sm mx-auto">
      {/* Rain Particle System */}
      <div className="absolute inset-x-8 -bottom-32 h-32 overflow-hidden pointer-events-none flex justify-around z-0">
        {isRaining &&
          rainDrops.map((drop, i) => (
            <motion.div
              key={i}
              initial={{ y: -20, opacity: 0 }}
              animate={{
                y: [0, 150],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: drop.duration,
                repeat: Infinity,
                delay: drop.delay,
                ease: "linear",
              }}
              className="w-[2px] h-8 bg-sky-200/70 rounded-full"
              style={{ willChange: "transform, opacity", transform: "translateZ(0)" }}
            />
          ))}
      </div>

      {/* Floating Cloud */}
      <motion.div
        whileHover={{ y: -8 }}
        whileTap={{ scale: 0.97 }}
        animate={{
          y: [0, -12, 0],
        }}
        transition={{
          y: {
            duration: cloudMotion.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: delay,
          },
        }}
        onClick={handleClick}
        className="relative z-10 cursor-pointer mt-16"
        style={{ 
          filter: "drop-shadow(0 20px 30px rgba(0, 0, 0, 0.08)) drop-shadow(0 4px 6px rgba(0, 0, 0, 0.04))",
          willChange: "transform, filter",
          transform: "translateZ(0)"
        }}
      >
        <motion.div 
          animate={isThundering ? {
            x: [-10, 10, -8, 8, -4, 4, 0],
            backgroundColor: cloudBgColor,
            color: "#0f172a"
          } : {
            x: 0,
            backgroundColor: cloudBgColor, 
            color: isRaining ? "#f8fafc" : "#0f172a"
          }}
          transition={isThundering ? { duration: 0.25 } : { duration: 0.5 }}
          className="relative rounded-[40px] px-8 pt-14 pb-12 w-full"
          style={{ 
            boxShadow: "inset 0 -12px 24px rgba(0,0,0,0.04), inset 0 4px 12px rgba(255,255,255,0.8)",
            willChange: "transform, background-color" 
          }}
        >
          {/* Organic Cloud Humps */}
          {/* Top Left Hump */}
          <motion.div 
            animate={{ backgroundColor: cloudBgColor }}
            transition={isThundering ? { duration: 0.1 } : { duration: 0.5 }}
            className="absolute -top-12 left-[10%] h-32 w-32 rounded-full" 
            style={{ boxShadow: "inset 10px 10px 20px rgba(255,255,255,0.6)" }}
          />
          {/* Top Center/Right Hump (Largest) */}
          <motion.div 
            animate={{ backgroundColor: cloudBgColor }}
            transition={isThundering ? { duration: 0.1 } : { duration: 0.5 }}
            className="absolute -top-20 right-[15%] h-44 w-44 rounded-full" 
            style={{ boxShadow: "inset 10px 10px 20px rgba(255,255,255,0.6)" }}
          />
          {/* Bottom Right Hump (Soft edge) */}
          <motion.div 
            animate={{ backgroundColor: cloudBgColor }}
            transition={isThundering ? { duration: 0.1 } : { duration: 0.5 }}
            className="absolute -bottom-8 right-6 h-24 w-24 rounded-full" 
            style={{ boxShadow: "inset -10px -10px 20px rgba(0,0,0,0.02)" }}
          />
          {/* Bottom Left Hump (Soft edge) */}
          <motion.div 
            animate={{ backgroundColor: cloudBgColor }}
            transition={isThundering ? { duration: 0.1 } : { duration: 0.5 }}
            className="absolute -bottom-6 left-10 h-20 w-28 rounded-full" 
            style={{ boxShadow: "inset 0 -10px 20px rgba(0,0,0,0.02)" }}
          />
          
          {/* Content */}
          <div className="relative z-20 flex flex-col items-center text-center">
            <motion.span 
              animate={{
                backgroundColor: isRaining ? "rgba(255,255,255,0.1)" : "#e0f2fe", // sky-100
                color: isRaining ? "#bae6fd" : "#0284c7" // sky-200 / sky-600
              }}
              className="inline-flex rounded-full p-4 mb-4"
            >
              <Icon size={32} />
            </motion.span>
            
            <h3 className="font-black text-3xl mb-3 tracking-tight drop-shadow-sm">{audience.title}</h3>
            
            <motion.p 
              animate={{ color: isRaining ? "#cbd5e1" : "#64748b" }}
              className="text-[15px] mb-8 leading-relaxed font-medium px-2"
            >
              {audience.description}
            </motion.p>
            
            <ul className="w-full space-y-4 text-left">
              {audience.outcomes.map((outcome) => (
                <li key={outcome} className="flex items-start gap-3 text-[15px] font-bold">
                  <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors duration-500 ${isRaining ? 'bg-sky-400/20' : 'bg-sky-50'}`}>
                    <Check 
                      size={14} 
                      strokeWidth={3}
                      className={`transition-colors duration-500 ${isRaining ? 'text-sky-300' : 'text-sky-500'}`} 
                    />
                  </span>
                  <span className="leading-snug pt-0.5">{outcome}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

"use client";

import { useState, useRef } from "react";
import { Clock, MapPin, Users, Rocket, Star, Sparkles, ArrowRight, ArrowLeft, Zap, Target, Lightbulb, Coffee } from "lucide-react";
import {
  selectScheduleDay,
  type ScheduleEvent,
  type EventDay,
} from "@/lib/landing/schedule";

interface ScheduleExplorerProps {
  events: ScheduleEvent[];
}

function formatTime(time: string): string {
  const [h, m] = time.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${m} ${ampm}`;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function getTypeBadge(type: string): { bg: string; label: string } {
  switch (type) {
    case "open": return { bg: "bg-sky-500/10 text-sky-500 border-sky-500/20", label: "Open" };
    case "registration": return { bg: "bg-accent/10 text-accent border-accent/20", label: "Registration" };
    case "shortlisted": return { bg: "bg-pink-500/10 text-pink-500 border-pink-500/20", label: "Apply to Pitch" };
    case "restricted": return { bg: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20", label: "Restricted" };
    default: return { bg: "bg-surface-alt/50 text-ink-muted border-surface-alt", label: type };
  }
}

// Decorative stickers to fill the empty spaces
const STICKERS = [
  { icon: Zap, label: "High Energy", color: "text-yellow-500", bg: "bg-yellow-500/10", rotate: "-rotate-6" },
  { icon: Target, label: "Founder Focus", color: "text-pink-500", bg: "bg-pink-500/10", rotate: "rotate-6" },
  { icon: Lightbulb, label: "Innovation", color: "text-sky-500", bg: "bg-sky-500/10", rotate: "-rotate-3" },
  { icon: Coffee, label: "Networking", color: "text-amber-600", bg: "bg-amber-500/10", rotate: "rotate-3" },
  { icon: Rocket, label: "To The Moon", color: "text-accent", bg: "bg-accent/10", rotate: "-rotate-12" },
];

export function ScheduleExplorer({ events }: ScheduleExplorerProps) {
  const [activeDay, setActiveDay] = useState<EventDay>(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const dayEvents = selectScheduleDay(events, activeDay);
  const timeSlots = groupByTime(dayEvents);

  const handleDaySwitch = (day: EventDay) => {
    setActiveDay(day);
    // Smooth scroll back to the top of the schedule container
    if (containerRef.current) {
      const yOffset = -100; // offset for fixed headers if any
      const element = containerRef.current;
      const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div ref={containerRef}>
      {/* Day toggle */}
      <div className="flex gap-4" role="group" aria-label="Schedule day selector">
        <button
          type="button"
          onClick={() => handleDaySwitch(1)}
          aria-pressed={activeDay === 1}
          className={`relative rounded-full px-8 py-3 text-sm font-bold transition-all duration-300 ${
            activeDay === 1
              ? "bg-accent text-[#0a0a0b]"
              : "border border-surface-alt bg-surface text-ink-muted hover:text-ink hover:border-accent"
          }`}
        >
          Day 1 (2 Sept)
        </button>
        <button
          type="button"
          onClick={() => handleDaySwitch(2)}
          aria-pressed={activeDay === 2}
          className={`relative rounded-full px-8 py-3 text-sm font-bold transition-all duration-300 ${
            activeDay === 2
              ? "bg-accent text-[#0a0a0b]"
              : "border border-surface-alt bg-surface text-ink-muted hover:text-ink hover:border-accent"
          }`}
        >
          Day 2 (3 Sept)
        </button>
      </div>

      {/* Timeline */}
      {dayEvents.length === 0 ? (
        <div className="mt-16 flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-alt py-20">
          <p className="text-lg text-ink-muted">No events scheduled for this day.</p>
        </div>
      ) : (
        <div className="relative mt-16 pb-12">
          {/* The Vertical Line */}
          <div className="absolute left-6 top-2 bottom-0 w-[2px] -translate-x-1/2 bg-surface-alt tablet:left-1/2" />

          <div className="space-y-12">
            {timeSlots.map((slot, idx) => {
              const isEven = idx % 2 === 0;
              const TimelineIcons = [Rocket, Star, Sparkles];
              const TimelineIcon = TimelineIcons[idx % TimelineIcons.length];
              
              const sticker = STICKERS[idx % STICKERS.length];
              const StickerIcon = sticker.icon;

              return (
                <div key={slot.time} className="relative w-full group">
                  {/* The Imprint Icon */}
                  <div className="absolute left-6 top-4 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full bg-surface text-surface-alt transition-transform group-hover:scale-110 group-hover:text-accent tablet:left-1/2 z-10">
                    <TimelineIcon className="h-4 w-4" />
                  </div>

                  {/* Desktop Time & Sticker (fills the empty space) */}
                  <div className={`absolute top-2 hidden w-[calc(50%-3rem)] tablet:flex tablet:flex-col ${
                    isEven 
                      ? "right-[calc(50%+3rem)] items-end text-right" 
                      : "left-[calc(50%+3rem)] items-start text-left"
                  }`}>
                    {/* Time Pill */}
                    <span className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-1.5 text-sm font-bold text-accent border border-accent/20">
                      <Clock className="h-4 w-4" />
                      {formatTime(slot.time)}
                    </span>
                    
                    {/* Decorative Sticker in the blank space */}
                    <div className={`mt-8 inline-flex items-center gap-2 rounded-xl border border-surface-alt/50 px-4 py-2 opacity-40 grayscale transition-all duration-300 group-hover:opacity-100 group-hover:grayscale-0 ${sticker.bg} ${sticker.rotate}`}>
                      <StickerIcon className={`h-5 w-5 ${sticker.color}`} />
                      <span className={`text-sm font-black uppercase tracking-wider ${sticker.color}`}>
                        {sticker.label}
                      </span>
                    </div>
                  </div>

                  {/* Events Container */}
                  <div className={`pl-14 tablet:pl-0 tablet:w-[calc(50%-3rem)] ${
                    isEven ? "tablet:ml-[calc(50%+3rem)]" : "tablet:mr-[calc(50%+3rem)]"
                  }`}>
                    {/* Mobile Time */}
                    <div className="mb-4 tablet:hidden">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-bold text-accent border border-accent/20">
                        <Clock className="h-3 w-3" />
                        {formatTime(slot.time)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-5">
                      {slot.events.map((event) => {
                        const badge = getTypeBadge(event.type);
                        return (
                          <article
                            key={event.id}
                            className="group/card relative overflow-hidden rounded-2xl border border-surface-alt bg-canvas p-5 transition-all hover:-translate-y-1 hover:border-accent"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${badge.bg}`}>
                                {badge.label}
                              </span>
                            </div>
                            <h4 className="mt-4 text-lg font-bold text-ink leading-tight group-hover/card:text-accent transition-colors">
                              {event.name}
                            </h4>
                            <div className="mt-4 space-y-2 text-sm text-ink-muted">
                              <p className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-ink-muted/70" aria-hidden="true" />
                                {formatTime(event.startTime)} – {formatTime(event.endTime)}
                              </p>
                              <p className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-ink-muted/70" aria-hidden="true" />
                                {event.venue}
                              </p>
                              {event.capacity && (
                                <p className="flex items-center gap-2">
                                  <Users className="h-4 w-4 text-ink-muted/70" aria-hidden="true" />
                                  {event.registrationStatus === "full" ? (
                                    <span className="text-pink-500 font-semibold">House Full</span>
                                  ) : (
                                    <span>{event.currentRegistrations} / {event.capacity} Registered</span>
                                  )}
                                </p>
                              )}
                              {event.coordinatorName && (
                                <p className="flex items-center gap-2">
                                  <Users className="h-4 w-4 text-ink-muted/70" aria-hidden="true" />
                                  <span>{event.coordinatorName}</span>
                                </p>
                              )}
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Continuity Buttons at the bottom */}
          <div className="mt-16 flex justify-center tablet:justify-start tablet:ml-[calc(50%+3rem)]">
            {activeDay === 1 ? (
              <button
                onClick={() => handleDaySwitch(2)}
                className="group inline-flex items-center gap-2 rounded-full bg-surface-alt px-6 py-3 text-sm font-bold text-ink transition-colors hover:bg-accent hover:text-[#0a0a0b]"
              >
                View Next Day&apos;s Schedule
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            ) : (
              <button
                onClick={() => handleDaySwitch(1)}
                className="group inline-flex items-center gap-2 rounded-full bg-surface-alt px-6 py-3 text-sm font-bold text-ink transition-colors hover:bg-accent hover:text-[#0a0a0b]"
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Back to Previous Day
              </button>
            )}
          </div>
          
        </div>
      )}
    </div>
  );
}

function groupByTime(
  events: ScheduleEvent[]
): { time: string; events: ScheduleEvent[] }[] {
  const sorted = [...events].sort(
    (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  );
  const map = new Map<string, ScheduleEvent[]>();
  for (const e of sorted) {
    if (!map.has(e.startTime)) map.set(e.startTime, []);
    map.get(e.startTime)!.push(e);
  }
  return Array.from(map.entries()).map(([time, evts]) => ({ time, events: evts }));
}

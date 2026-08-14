"use client";

import { useReducer, useCallback, useMemo } from "react";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import type { FaqItem } from "@/lib/landing/content/contracts";
import {
  createFaqAccordionReducer,
  INITIAL_FAQ_ACCORDION_STATE,
} from "@/lib/landing/faq-accordion";

interface FaqAccordionProps {
  items: readonly FaqItem[];
}

/**
 * Accessible FAQ accordion component with single-open toggle semantics.
 *
 * - All answers collapsed initially (state = null)
 * - Native <button> elements for keyboard activation (Enter/Space built-in)
 * - Stable ARIA linkage: aria-expanded + aria-controls → panel id
 * - Single-open behavior via the pure reducer
 * - 200-400ms expand/collapse transition (CSS grid-template-rows technique)
 * - Instant show/hide when prefers-reduced-motion is active
 * - Visible focus indicators via --color-focus ring (from globals.css base styles)
 */
export function FaqAccordion({ items }: FaqAccordionProps) {
  const faqIds = useMemo(() => items.map((item) => item.id), [items]);
  const reducer = useMemo(() => createFaqAccordionReducer(faqIds), [faqIds]);
  const [openId, dispatch] = useReducer(reducer, INITIAL_FAQ_ACCORDION_STATE);
  const shouldReduceMotion = useReducedMotion();

  const handleToggle = useCallback(
    (id: string) => {
      dispatch({ type: "activate", id });
    },
    [dispatch],
  );

  return (
    <div className="divide-y divide-surface-alt">
      {items.map((item) => (
        <FaqEntry
          key={item.id}
          item={item}
          isOpen={openId === item.id}
          onToggle={handleToggle}
          reduceMotion={!!shouldReduceMotion}
        />
      ))}
    </div>
  );
}

interface FaqEntryProps {
  item: FaqItem;
  isOpen: boolean;
  onToggle: (id: string) => void;
  reduceMotion: boolean;
}

function FaqEntry({ item, isOpen, onToggle, reduceMotion }: FaqEntryProps) {
  const buttonId = `faq-button-${item.id}`;
  const panelId = `faq-panel-${item.id}`;

  return (
    <div className="py-4">
      <h3>
        <button
          id={buttonId}
          type="button"
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={() => onToggle(item.id)}
          className="group flex w-full items-center justify-between gap-4 py-4 text-left font-serif text-xl font-semibold text-ink transition-colors hover:text-primary"
        >
          <span>{item.question}</span>
          <ChevronIcon isOpen={isOpen} reduceMotion={reduceMotion} />
        </button>
      </h3>

      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        className="overflow-hidden px-6"
        style={
          reduceMotion
            ? undefined
            : {
                display: "grid",
                gridTemplateRows: isOpen ? "1fr" : "0fr",
                transition: "grid-template-rows 300ms ease-out",
              }
        }
      >
        {reduceMotion ? (
          isOpen ? (
            <div className="pb-6 text-lg leading-relaxed text-ink-muted">{item.answer}</div>
          ) : null
        ) : (
          <div className="min-h-0">
            <div className="pb-6 text-lg leading-relaxed text-ink-muted">{item.answer}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function ChevronIcon({
  isOpen,
  reduceMotion,
}: {
  isOpen: boolean;
  reduceMotion: boolean;
}) {
  return (
    <svg
      aria-hidden="true"
      width="24"
      height="24"
      viewBox="0 0 20 20"
      fill="none"
      className="shrink-0 text-ink-muted transition-colors group-hover:text-primary"
      style={{
        transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
        transition: reduceMotion ? "none" : "transform 300ms ease-out",
      }}
    >
      <path
        d="M5 7.5L10 12.5L15 7.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

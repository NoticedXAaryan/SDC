# 09 — Accessibility, Responsive Behaviour, and Performance

## Standard

Meet WCAG 2.2 AA for the production experience and use a mobile-first responsive contract. Club members will access event passes, registrations, scanner workflows, notifications, and forms from phones under poor venue connectivity; desktop quality alone is not sufficient.

## Step-by-step responsive and accessibility work

1. Define device test widths at 320/375/390px, 768px, 1024px, and 1440px. Test portrait and landscape where scanner/camera use matters.
2. Document primary tasks per page and make them viable with one thumb/keyboard: register, display pass, scan, approve, submit, save, and find status.
3. Use responsive template contracts instead of merely shrinking desktop grids. Tables become readable cards or horizontal views with a chosen priority order; forms become one column; multi-action headers collapse predictably.
4. Ensure targets are at least 44 by 44 CSS pixels where touch controls are expected, with visible focus and no hover-only essential action.
5. Use semantic landmarks, one logical H1, headings in order, labelled form controls, descriptive link text, error summaries, and programmatic status updates (`aria-live`) for submissions, scanning, and queue progress.
6. Put focus deliberately after route/dialog changes, validation errors, successful submission, and error states. Restore focus to the launcher when closing a dialog/sheet.
7. Make every interaction keyboard operable: navigation, command palette, date selection, table actions, dialog confirmation, scanner fallback, file upload, and drag/drop alternatives.
8. Maintain AA contrast for text, borders, focus rings, charts, badges, overlaying cosmic backgrounds, and disabled-but-explanatory controls. Do not use chromatic glow as the only state signal.
9. Honour `prefers-reduced-motion`, `prefers-contrast`, system colour scheme, text zoom, and browser translation without clipped or overlapping UI.
10. Provide text alternatives for the SOC logo when meaningful and mark purely decorative stars/orbits/SVG imprints as hidden from assistive technology.
11. Design scanner and camera workflows with alternatives: manual pass-code entry, image upload where suitable, network/offline state, no-camera explanation, and permission-denied recovery.
12. Set performance budgets: public LCP under 2.5s on representative mobile, CLS under 0.1, responsive interaction feedback, and scanner startup within the agreed venue-device limit. Measure real user data after consent.
13. Reduce client JavaScript. Prefer server rendering for public/read-heavy pages, lazy-load camera/PDF/face models only after user action, optimize images/SVGs, and avoid downloading animation libraries for static decoration.
14. Virtualise or paginate long operational lists; debounce search with cancellation; cache safe reads; and show predictable skeletons rather than layout-shifting spinners.
15. Test with slow 3G/4G, CPU throttle, full/empty data, long names, small viewports, browser zoom, keyboard only, screen reader, and reduced motion before each journey acceptance.

## Exit criteria

The system is accepted when each primary journey works at phone width and by keyboard, assistive technology receives meaningful status, cosmic decoration never harms clarity, and performance budgets have measured evidence rather than assumptions.

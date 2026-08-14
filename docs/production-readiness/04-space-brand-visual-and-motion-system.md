# 04 — Space Brand, Visual, and Motion System

## Brand premise

The supplied SOC mark is a black-hole/space identity with a dark central mass and chromatic green-violet edge. The interface should feel like a carefully engineered observatory: deep, focused, dimensional, and calm. It must not become a neon science-fiction dashboard that competes with club work.

## Visual rules

- Use the actual supplied mark as the source asset. Produce clean, licensed derivatives (SVG where possible and optimized raster fallbacks) through an approved design/export process; do not trace a low-quality image into a misleading logo.
- Put the black hole in high-attention brand moments: landing hero, authentication, empty/error states, onboarding, and a restrained dashboard identity. Do not repeat it in every card.
- Use a dark-first canvas with layered star fields, faint constellation/trajectory lines, soft radial wells, and sparse starbursts. Decoration belongs behind content and must never reduce contrast or readability.
- Reserve green-violet chromatic edge effects for brand emphasis, active/focus highlights, and celebratory states. Operational warning/danger colours remain semantically distinct.
- Background imprints should be low contrast and adaptive: fewer particles, no distracting parallax, and reduced density on mobile.

## Asset inventory

Create these reusable assets under `public/brand/` and `components/design-system/cosmic/`:

- `soc-mark.svg`, `soc-mark-monochrome.svg`, and an approved favicon/app-icon set;
- `black-hole-field.svg`: purely decorative accessible-hidden SVG background;
- `orbit-path.svg`, `starburst.svg`, and `constellation-grid.svg` as simple vector primitives;
- `CosmicSurface`, `OrbitalMetric`, `LensingDivider`, `StarField`, and `BlackHoleLoader` components;
- a tokenised motion preset set: `enter`, `rise`, `orbit`, `pulse`, `success`, and `exit`.

## Step-by-step visual implementation

1. Obtain logo-owner approval for the master asset, colour values, safe space, minimum size, dark/light variants, and where the wordmark may be omitted.
2. Replace the supplied JPEG only after an approved source asset exists. Keep the JPEG in the design-reference folder; do not use a raster screenshot as a production identity asset.
3. Define brand tokens from perceptual roles, not hardcoded CSS: `--soc-well`, `--soc-accretion-violet`, `--soc-accretion-lime`, `--soc-starlight`, `--soc-orbit`, and `--soc-nebula`.
4. Build the black-hole treatment as layered SVG/CSS, not a continuously animated video or high-cost canvas. It must have a static fallback.
5. Create a single `CosmicBackground` component with variants for public, auth, dashboard, scanner, and subdued. It must render `aria-hidden`, disable pointer events, and have no layout impact.
6. Give each route category one recognisable visual cue: public uses the strongest celestial field, authenticated workspace uses restrained orbital lines, operational/scanner pages prioritise contrast and live feedback.
7. Apply decoration behind opaque or sufficiently contrasted content surfaces. Test text and control contrast in both light and dark modes.
8. Use custom SVGs for dividers, empty states, achievement milestones, and event status visuals. Keep SVG paths simple, compressed, and sanitized; never inject untrusted SVG markup.
9. Define motion intent before implementation: motion should explain change (new result, state transition, hierarchy), guide attention, or reward completion—not entertain during routine data entry.
10. Set duration and distance limits: micro interactions 120–200ms, content transition 180–280ms, and one ambient background animation per view at most. Avoid infinite attention-grabbing motion near forms and scanners.
11. Respect `prefers-reduced-motion` by removing orbit/parallax, replacing loaders with static progress indicators, and avoiding auto-play effects. Ensure the same state is understandable without animation.
12. Test performance on a low-end mobile device and throttled network. Star fields and gradients must not cause scroll jank, heat, battery drain, or hinder the camera scanner.
13. Audit contrast, focus indicators, and seizure-sensitive flashing. Never flash more than three times per second; avoid strong strobe or rapidly alternating chromatic effects.
14. Create route-level screenshots at 375px, 768px, 1024px, and 1440px. Compare against a visual checklist rather than relying on developer preference.
15. Review visual consistency with the club team and revise the token/asset system once. Avoid per-page exceptions after review.

## Exit criteria

The visual system is accepted when the logo is legally/technically usable, cosmic effects are tokenised and reusable, motion is accessible and performant, information remains clearer than decoration, and the landing footer remains unchanged.

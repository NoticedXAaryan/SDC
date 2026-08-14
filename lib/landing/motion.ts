export const REVEAL_INTERSECTION_THRESHOLD = 0.2;
export const MAX_REVEAL_TRANSLATE_Y_PX = 24;
export const MIN_PAGE_ANIMATION_DURATION_MS = 300;
export const MAX_PAGE_ANIMATION_DURATION_MS = 600;
export const PAGE_ANIMATION_EASING = "easeOut" as const;

export interface AnimationVisualState { readonly opacity: number; readonly y: number }
export interface AnimationDescriptor {
  readonly initial: AnimationVisualState;
  readonly final: AnimationVisualState;
  readonly durationMs: number;
  readonly easing: typeof PAGE_ANIMATION_EASING;
}
export interface AnimationProjection {
  readonly initial: AnimationVisualState;
  readonly animate: AnimationVisualState;
  readonly transition?: Readonly<{ duration: number; ease: typeof PAGE_ANIMATION_EASING }>;
}

export const DEFAULT_REVEAL_ANIMATION: AnimationDescriptor = {
  initial: { opacity: 0, y: MAX_REVEAL_TRANSLATE_Y_PX },
  final: { opacity: 1, y: 0 },
  durationMs: 450,
  easing: PAGE_ANIMATION_EASING,
};

export function isApprovedAnimationDescriptor(descriptor: AnimationDescriptor): boolean {
  const distance = descriptor.initial.y - descriptor.final.y;
  return Number.isFinite(descriptor.initial.opacity)
    && Number.isFinite(descriptor.final.opacity)
    && descriptor.initial.opacity >= 0 && descriptor.initial.opacity <= 1
    && descriptor.final.opacity >= 0 && descriptor.final.opacity <= 1
    && Number.isFinite(distance) && distance >= 0 && distance <= MAX_REVEAL_TRANSLATE_Y_PX
    && Number.isFinite(descriptor.durationMs)
    && descriptor.durationMs >= MIN_PAGE_ANIMATION_DURATION_MS
    && descriptor.durationMs <= MAX_PAGE_ANIMATION_DURATION_MS
    && descriptor.easing === PAGE_ANIMATION_EASING;
}

export function projectAnimation(descriptor: AnimationDescriptor, reduceMotion: boolean): AnimationProjection {
  if (!isApprovedAnimationDescriptor(descriptor)) throw new RangeError("Animation descriptor violates the page motion policy");
  const final = { ...descriptor.final };
  if (reduceMotion) return { initial: { ...final }, animate: final };
  return {
    initial: { ...descriptor.initial }, animate: final,
    transition: { duration: descriptor.durationMs / 1_000, ease: descriptor.easing },
  };
}

export type RevealState = "hidden" | "revealed";
export const INITIAL_REVEAL_STATE: RevealState = "hidden";
export function advanceRevealState(state: RevealState, intersectionRatio: number): RevealState {
  if (state === "revealed") return "revealed";
  return Number.isFinite(intersectionRatio) && intersectionRatio >= REVEAL_INTERSECTION_THRESHOLD
    ? "revealed" : "hidden";
}

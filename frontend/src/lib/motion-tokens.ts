import { Transition, Variants } from "framer-motion";

export const MOTION_DURATIONS = {
  instant: 0.05,
  fast: 0.16,
  normal: 0.28,
  slow: 0.48,
  cinematic: 0.75,
};

export const MOTION_EASINGS = {
  // Editorial fluid spring-like cubic beziers
  editorial: [0.16, 1, 0.3, 1] as [number, number, number, number],
  tactile: [0.22, 1, 0.36, 1] as [number, number, number, number],
  cinematic: [0.25, 1, 0.5, 1] as [number, number, number, number],
  sharp: [0.4, 0, 0.2, 1] as [number, number, number, number],
};

export const MOTION_SPRINGS = {
  tactile: { type: "spring", stiffness: 420, damping: 28 },
  gentle: { type: "spring", stiffness: 280, damping: 26 },
  bouncy: { type: "spring", stiffness: 380, damping: 22 },
  snappy: { type: "spring", stiffness: 500, damping: 32 },
};

/**
 * Returns accessible transition respecting reduced motion preference.
 */
export function getMotionTransition(
  transition: Transition,
  reduceMotion: boolean = false
): Transition {
  if (reduceMotion) {
    return { duration: 0.01, ease: "linear" };
  }
  return transition;
}

// 1. Container Stagger
export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
};

export const staggerFastVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.02,
    },
  },
};

// 2. Editorial Typography Reveals
export const wordRevealVariants: Variants = {
  hidden: { y: "110%", opacity: 0 },
  visible: {
    y: "0%",
    opacity: 1,
    transition: {
      duration: MOTION_DURATIONS.slow,
      ease: MOTION_EASINGS.editorial,
    },
  },
};

export const lineRevealVariants: Variants = {
  hidden: { y: 24, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: MOTION_DURATIONS.normal,
      ease: MOTION_EASINGS.editorial,
    },
  },
};

// 3. Manga Panel & Artwork Masks
export const panelShutterVariants: Variants = {
  hidden: { clipPath: "polygon(0 0, 0 0, 0 100%, 0% 100%)", opacity: 0.2 },
  visible: {
    clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
    opacity: 1,
    transition: {
      duration: MOTION_DURATIONS.cinematic,
      ease: MOTION_EASINGS.editorial,
    },
  },
};

export const diagonalWipeVariants: Variants = {
  hidden: { clipPath: "polygon(0 0, 0 0, 0 100%, 0 100%)" },
  visible: {
    clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
    transition: {
      duration: 0.6,
      ease: MOTION_EASINGS.cinematic,
    },
  },
};

// 4. Poster & Card Interactions
export const cardHoverVariants: Variants = {
  initial: { scale: 1, y: 0 },
  hover: {
    scale: 1.02,
    y: -4,
    transition: {
      duration: MOTION_DURATIONS.fast,
      ease: MOTION_EASINGS.tactile,
    },
  },
  tap: {
    scale: 0.98,
    y: 0,
  },
};

// 5. Tactile Button Tap
export const buttonTapVariants: Variants = {
  hover: { scale: 1.02 },
  tap: { scale: 0.96 },
};

// 6. Fade In Up
export const fadeInUpVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: MOTION_DURATIONS.normal,
      ease: MOTION_EASINGS.editorial,
    },
  },
};

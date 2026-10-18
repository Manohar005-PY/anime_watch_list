/**
 * KAGE Cinematic Typography System & Tokens
 *
 * Designed to provide clear legibility, strong visual hierarchy, and an editorial
 * anime-inspired aesthetic without oversized containers or visual clutter.
 *
 * Targets:
 * - Hero Headline: Fluid clamp (2.25rem to 4.25rem)
 * - Section Headings: 22px to 32px
 * - Subheadings / Card Titles: 17px to 20px
 * - Body Text (Desktop): 16px to 17px
 * - Secondary Descriptions: 14px to 15px
 * - Navigation: 14px to 16px
 * - Form Labels & Standard Controls: 14px to 16px
 * - Small Metadata / Timestamps: 12px to 13px (never below 12px for readability)
 */

export interface TypographyToken {
  fontSize: string;
  lineHeight: string;
  letterSpacing: string;
  fontWeight: string;
  description: string;
}

export const TYPOGRAPHY_SCALE: Record<string, TypographyToken> = {
  hero: {
    fontSize: "clamp(2.25rem, 1.5rem + 3.5vw, 4.25rem)",
    lineHeight: "1.05",
    letterSpacing: "-0.04em",
    fontWeight: "800",
    description: "Fluid monument hero headline on landing page",
  },
  h1: {
    fontSize: "clamp(1.75rem, 1.25rem + 1.8vw, 2.5rem)",
    lineHeight: "1.15",
    letterSpacing: "-0.03em",
    fontWeight: "700",
    description: "Primary page headers (Dashboard, Collection, Auth titles)",
  },
  h2: {
    fontSize: "clamp(1.375rem, 1.1rem + 1vw, 2rem)",
    lineHeight: "1.25",
    letterSpacing: "-0.025em",
    fontWeight: "700",
    description: "Major section headers & spotlight titles (22px - 32px)",
  },
  h3: {
    fontSize: "clamp(1.125rem, 1rem + 0.4vw, 1.375rem)",
    lineHeight: "1.35",
    letterSpacing: "-0.02em",
    fontWeight: "600",
    description: "Subsection titles & modal headings (18px - 22px)",
  },
  cardTitle: {
    fontSize: "1.125rem", // 18px
    lineHeight: "1.35",
    letterSpacing: "-0.015em",
    fontWeight: "600",
    description: "Anime card titles in grid and list views (17px - 18px)",
  },
  bodyLead: {
    fontSize: "1.0625rem", // 17px
    lineHeight: "1.6",
    letterSpacing: "normal",
    fontWeight: "400",
    description: "Explanatory lead text and feature descriptions (16px - 18px)",
  },
  body: {
    fontSize: "1rem", // 16px
    lineHeight: "1.55",
    letterSpacing: "normal",
    fontWeight: "400",
    description: "Default body text across all views (16px)",
  },
  bodySmall: {
    fontSize: "0.9375rem", // 15px
    lineHeight: "1.5",
    letterSpacing: "normal",
    fontWeight: "400",
    description: "Secondary explanations, notes, and modal descriptions (14px - 15px)",
  },
  nav: {
    fontSize: "0.9375rem", // 15px
    lineHeight: "1.4",
    letterSpacing: "0.02em",
    fontWeight: "500",
    description: "Main header navigation and breadcrumbs (14px - 16px)",
  },
  control: {
    fontSize: "0.9375rem", // 15px
    lineHeight: "1.4",
    letterSpacing: "normal",
    fontWeight: "500",
    description: "Buttons, select dropdowns, search inputs, and tabs (14px - 16px)",
  },
  label: {
    fontSize: "0.875rem", // 14px
    lineHeight: "1.35",
    letterSpacing: "0.025em",
    fontWeight: "600",
    description: "Form labels, status pills, and action badges (14px)",
  },
  meta: {
    fontSize: "0.8125rem", // 13px
    lineHeight: "1.35",
    letterSpacing: "0.03em",
    fontWeight: "500",
    description: "Timestamps, episode counts, genre tags, and specs (12px - 13px)",
  },
  caption: {
    fontSize: "0.75rem", // 12px
    lineHeight: "1.3",
    letterSpacing: "0.04em",
    fontWeight: "500",
    description: "Small decorative tags and micro indices (strictly capped at minimum 12px)",
  },
};

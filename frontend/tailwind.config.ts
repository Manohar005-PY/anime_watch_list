import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        kage: {
          bg: "#080808",
          surface: "#121212",
          "surface-raised": "#181818",
          "surface-hover": "#222222",
          border: "#262626",
          "border-focus": "#525252",
          "text-primary": "#F5F5F5",
          "text-secondary": "#A3A3A3",
          "text-muted": "#737373",
          accent: "#FFFFFF",
        },
      },
      fontSize: {
        "kage-hero": ["clamp(2.25rem, 1.5rem + 3.5vw, 4.25rem)", { lineHeight: "1.05", letterSpacing: "-0.04em" }],
        "kage-h1": ["clamp(1.75rem, 1.25rem + 1.8vw, 2.5rem)", { lineHeight: "1.15", letterSpacing: "-0.03em" }],
        "kage-h2": ["clamp(1.375rem, 1.1rem + 1vw, 2rem)", { lineHeight: "1.25", letterSpacing: "-0.025em" }],
        "kage-h3": ["clamp(1.125rem, 1rem + 0.4vw, 1.375rem)", { lineHeight: "1.35", letterSpacing: "-0.02em" }],
        "kage-card-title": ["1.125rem", { lineHeight: "1.35", letterSpacing: "-0.015em" }], // 18px
        "kage-lead": ["1.0625rem", { lineHeight: "1.6" }], // 17px
        "kage-body": ["1rem", { lineHeight: "1.55" }], // 16px
        "kage-body-sm": ["0.9375rem", { lineHeight: "1.5" }], // 15px
        "kage-nav": ["0.9375rem", { lineHeight: "1.4", letterSpacing: "0.02em" }], // 15px
        "kage-control": ["0.9375rem", { lineHeight: "1.4" }], // 15px
        "kage-label": ["0.875rem", { lineHeight: "1.35", letterSpacing: "0.025em" }], // 14px
        "kage-meta": ["0.8125rem", { lineHeight: "1.35", letterSpacing: "0.03em" }], // 13px
        "kage-caption": ["0.75rem", { lineHeight: "1.3", letterSpacing: "0.04em" }], // 12px
      },
      fontFamily: {
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      boxShadow: {
        "tactile": "0 1px 2px rgba(0, 0, 0, 0.8), 0 4px 12px rgba(0, 0, 0, 0.5)",
        "tactile-hover": "0 4px 12px rgba(0, 0, 0, 0.9), 0 12px 24px rgba(0, 0, 0, 0.6)",
      },
      keyframes: {
        "panel-wipe": {
          "0%": { clipPath: "polygon(0 0, 0 0, 0 100%, 0% 100%)" },
          "100%": { clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" },
        },
      },
      animation: {
        "panel-wipe": "panel-wipe 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
    },
  },
  plugins: [],
} satisfies Config;

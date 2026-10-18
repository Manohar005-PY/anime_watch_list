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

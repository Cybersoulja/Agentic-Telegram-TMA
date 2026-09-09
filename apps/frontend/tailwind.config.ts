import type { Config } from "tailwindcss";

// Color tokens map to this app's existing Telegram-theme CSS variables (defined in App.css,
// each falling back to var(--tg-theme-*, <default>)) instead of a hardcoded palette, so
// Tailwind utility classes stay theme-correct and auto-match the user's Telegram light/dark
// theme, per this repo's styling convention (see CLAUDE.md).
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "var(--bg-color)",
        foreground: "var(--text-color)",
        card: {
          DEFAULT: "var(--secondary-bg-color)",
          foreground: "var(--text-color)",
        },
        popover: {
          DEFAULT: "var(--secondary-bg-color)",
          foreground: "var(--text-color)",
        },
        primary: {
          DEFAULT: "var(--button-color)",
          foreground: "var(--button-text-color)",
        },
        secondary: {
          DEFAULT: "var(--secondary-bg-color)",
          foreground: "var(--text-color)",
        },
        muted: {
          DEFAULT: "var(--secondary-bg-color)",
          foreground: "var(--hint-color)",
        },
        accent: {
          DEFAULT: "var(--accent-color)",
          foreground: "var(--button-text-color)",
        },
        destructive: {
          DEFAULT: "var(--error-color)",
          foreground: "#ffffff",
        },
        success: "var(--success-color)",
        warning: "var(--warning-color)",
        link: "var(--link-color)",
        border: "var(--card-border)",
        input: "var(--card-border)",
        ring: "var(--button-color)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

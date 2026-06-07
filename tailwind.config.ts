import type { Config } from "tailwindcss";

// Design tokens for the "stadium at night" visual language.
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // deep navy / near-black canvas
        pitch: {
          950: "#05070f",
          900: "#080b16",
          850: "#0b1020",
          800: "#0f1629",
          700: "#161f38",
          600: "#1f2a47",
        },
        ink: {
          DEFAULT: "#e8edf7",
          muted: "#9aa6c2",
          faint: "#5d6986",
        },
        gold: {
          DEFAULT: "#e9b949",
          bright: "#ffd66b",
          deep: "#b8860b",
        },
        live: "#ff4d5e",
        win: "#39d98a",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["'Clash Display'", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0,0,0,0.45)",
        glow: "0 0 24px rgba(233,185,73,0.25)",
      },
      backgroundImage: {
        "stadium-glow":
          "radial-gradient(1200px 600px at 50% -10%, rgba(56,80,140,0.45), transparent 60%), radial-gradient(800px 500px at 90% 10%, rgba(233,185,73,0.10), transparent 55%)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s ease-out both",
        shimmer: "shimmer 1.8s linear infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;

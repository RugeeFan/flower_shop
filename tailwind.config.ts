import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/{**,.client,.server}/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        sans: ["'Inter Tight'", "Inter", "system-ui", "sans-serif"],
        body: ["'Inter Tight'", "Inter", "system-ui", "sans-serif"],
      },
      colors: {
        bone: "#F7F2EC",
        cream: "#EDE3D5",
        charcoal: "#1F1B17",
        "ink-muted": "#6B6258",
        sage: "#8D9E91",
        terracotta: {
          DEFAULT: "#C2705A",
          hover: "#8B3A2C",
        },
        border: "#DDD3C5",
        primary: {
          DEFAULT: "#C2705A",
          light: "#D89481",
          dark: "#8B3A2C",
        },
        text: {
          DEFAULT: "#1F1B17",
          light: "#F7F2EC",
          dark: "#1F1B17",
          hover: "#6B6258",
        },
      },
      borderRadius: {
        none: "0",
        sm: "2px",
        DEFAULT: "4px",
        md: "6px",
        pill: "9999px",
      },
      spacing: {
        "0.5": "2px",
        "1": "4px",
        "2": "8px",
        "3": "12px",
        "4": "16px",
        "6": "24px",
        "8": "32px",
        "12": "48px",
        "16": "64px",
        "24": "96px",
        "32": "128px",
      },
      boxShadow: {
        whisper: "0 1px 2px rgba(31,27,23,0.04)",
        soft: "0 2px 8px rgba(31,27,23,0.06)",
      },
      letterSpacing: {
        eyebrow: "0.08em",
      },
      lineHeight: {
        display: "1.05",
        body: "1.55",
      },
      transitionDuration: {
        DEFAULT: "200ms",
        slow: "400ms",
      },
      transitionTimingFunction: {
        DEFAULT: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  plugins: [],
} satisfies Config;

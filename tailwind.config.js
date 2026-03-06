/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#0A0A0C",
          secondary: "#111115",
          card: "#16161A",
          "card-hover": "#1C1C22",
        },
        text: {
          primary: "#F0EDE6",
          secondary: "#9B978F",
          muted: "#5E5B55",
        },
        accent: {
          DEFAULT: "var(--accent)",
          dark: "var(--accent-dark)",
          light: "#d4ff72",
          glow: "rgba(198, 255, 74, 0.15)",
          "glow-strong": "rgba(198, 255, 74, 0.3)",
        },
        border: {
          DEFAULT: "rgba(255, 255, 255, 0.06)",
          accent: "rgba(198, 255, 74, 0.2)",
        },
      },
      fontFamily: {
        sans: ['Afacad', 'sans-serif'],
        serif: ['"DM Serif"', 'serif'],
        display: ["Petrona", "Georgia", "serif"],
        body: ["Afacad", "system-ui", "sans-serif"],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      borderRadius: {
        card: "16px",
        "card-sm": "10px",
        pill: "100px",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(28px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-down": {
          from: { opacity: "0", transform: "translateY(-16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "orb-float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-14px)" },
        },
        "orb-glow-pulse": {
          "0%, 100%": { transform: "scale(1)", opacity: "0.55" },
          "50%": { transform: "scale(1.15)", opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.8s ease forwards",
        "fade-down": "fade-down 0.8s ease forwards",
        "orb-float": "orb-float 6s ease-in-out infinite",
        "orb-glow-pulse": "orb-glow-pulse 4s ease-in-out infinite",
      },
      boxShadow: {
        "accent-sm": "0 8px 32px rgba(198, 255, 74, 0.25)",
        "accent-md": "0 12px 40px rgba(198, 255, 74, 0.3)",
        "accent-glow": "0 0 60px rgba(198, 255, 74, 0.15)",
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#f0fdf4",
          100: "#dcfce7",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
        },
      },
      keyframes: {
        "nav-bounce": {
          "0%":   { transform: "scale(1) translateY(0)" },
          "40%":  { transform: "scale(1.25) translateY(-3px)" },
          "70%":  { transform: "scale(0.95) translateY(1px)" },
          "100%": { transform: "scale(1.1) translateY(0)" },
        },
        "slide-in-left": {
          from: { transform: "translateX(-100%)", opacity: "0.8" },
          to:   { transform: "translateX(0)",     opacity: "1" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        "pop-in": {
          "0%":   { opacity: "0", transform: "scale(0.92) translateY(8px)" },
          "60%":  { transform: "scale(1.02) translateY(-1px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
      },
      animation: {
        "nav-bounce":    "nav-bounce 0.35s ease-out",
        "slide-in-left": "slide-in-left 0.25s ease-out",
        "fade-up":       "fade-up 0.22s ease-out both",
        "fade-in":       "fade-in 0.2s ease-out",
        "pop-in":        "pop-in 0.28s cubic-bezier(0.34, 1.56, 0.64, 1) both",
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "var(--brand-primary)",     // #38f6c6
          secondary: "var(--brand-secondary)", // #60a5fa
          surface: "var(--brand-surface)",     // rgba(16,22,45,0.8)
          border: "var(--brand-border)",       // rgba(255,255,255,0.12)
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"], // à ajuster selon ton projet
      },
      boxShadow: {
        innerGlow: "inset 0 2px 6px rgba(0,0,0,0.3)",
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/aspect-ratio"),
  ],
}

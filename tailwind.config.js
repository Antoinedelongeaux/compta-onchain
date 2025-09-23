/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class", // utilise .dark sur <html> ou <body>
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}", // si tu as un dossier src
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "var(--brand-primary)",
          secondary: "var(--brand-secondary)",
          surface: "var(--brand-surface)",
          border: "var(--brand-border)",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
      },
      boxShadow: {
        innerGlow: "inset 0 2px 6px rgba(0,0,0,0.3)",
      },
    },
  },
  plugins: [],
}

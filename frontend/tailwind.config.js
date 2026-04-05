/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        party: {
          bg: "#0f0a1a",
          card: "#1a1230",
          accent: "#a78bfa",
          gold: "#fbbf24",
          warm: "#f97316",
          text: "#e2e0ea",
          muted: "#8b85a0",
        },
      },
    },
  },
  plugins: [],
};

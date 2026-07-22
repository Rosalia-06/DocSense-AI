/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          bg: "#0E1420",
          panel: "#161D2E",
          panelAlt: "#1E2740",
          border: "#2A3350",
        },
        text: {
          DEFAULT: "#E8EAF0",
          muted: "#8B93A8",
          faint: "#5A6280",
        },
        gold: {
          DEFAULT: "#D4A24C",
          soft: "#3A3220",
        },
        userMsg: "#2451C7",
        success: "#4ADE80",
        error: "#F87171",
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        body: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        chat: "18px",
      },
    },
  },
  plugins: [],
};
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        panel: {
          bg: "#0a0a0f",
          border: "#1a1a2e",
        },
        accent: {
          primary: "#00ffcc",
          secondary: "#3366ff",
        },
        rag: {
          critical: "#ff3333",
          warning: "#ff9933",
          caution: "#ffcc00",
          normal: "#33ff99",
          info: "#33ccff",
        },
        surface: {
          "100": "#0f0f1a",
          "200": "#1a1a2e",
          "300": "#252540",
        },
      },
      fontFamily: {
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;

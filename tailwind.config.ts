import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta rose-terracota inspirada no logo Casa Flor
        primary: {
          50:  "#FDF3F0",
          100: "#FAE4DE",
          200: "#F5C4B8",
          300: "#EDA090",
          400: "#E07A68",
          500: "#C4776A",
          600: "#A85E52",
          700: "#8B3A35",
          800: "#6E2B28",
          900: "#521F1D",
        },
        cream: {
          DEFAULT: "#F7EDE8",
          dark: "#EFE0D8",
        },
      },
      fontFamily: {
        script: ["Dancing Script", "cursive"],
      },
    },
  },
  plugins: [],
};

export default config;

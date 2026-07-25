import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/frontend/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#1e40af",
          light: "#3b82f6",
          dark: "#1e3a8a",
          navy: "#0a1730",
        },
        accent: {
          DEFAULT: "#6ee7b7",
          light: "#a7f3d0",
        },
        surface: "#f4f4f4",
      },
    },
  },
  plugins: [],
};

export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#0d59f2",
        "background-light": "#f5f6f8",
        "background-dark": "#101622",
        "background-dark-secondary": "#1b1f27",
        "text-light-primary": "#212529",
        "text-dark-primary": "#f8f9fa",
        "text-light-secondary": "#6C757D",
        "text-dark-secondary": "#a9b1bb",
      },
      fontFamily: {
        display: ["Inter", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px",
      },
    },
  },
  plugins: [],
};
export default config;

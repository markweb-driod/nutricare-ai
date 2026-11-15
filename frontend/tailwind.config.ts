import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#16835D",
          deep: "#123F35",
          mint: "#DDF3E8",
          sage: "#EDF7F1",
          canvas: "#FAFBF8",
          charcoal: "#20332E",
          info: "#245EAD",
          warning: "#995600",
          critical: "#B42318",
        },
      },
      fontFamily: {
        heading: ["var(--font-manrope)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
      },
      borderRadius: {
        card: "18px",
        btn: "12px",
      },
    },
  },
  plugins: [],
};
export default config;

import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    screens: {
      'sm': '520px',
    }
  },
  plugins: [],
} satisfies Config;

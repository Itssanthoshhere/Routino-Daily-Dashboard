import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      colors: {
        primary: {
          DEFAULT: "#a4161a",
          dark: "#8b1116",
          light: "#ba2d32",
        },
        gold: {
          DEFAULT: "#d4af37",
          light: "#fef3c7",
        },
        charcoal: "#111827",
        forest: "#a4161a", // MediVoice signature crimson brand color
        accent: "#d4af37", // MediVoice luxury gold accent
        ink: "#111827",
        cream: "#faf9f7",
        line: "#e5e7eb",
        muted: "#6b7280",
      },
      boxShadow: {
        card: "0 18px 36px rgba(16, 24, 40, 0.04), 0 2px 10px rgba(16, 24, 40, 0.03)",
        panel: "0 24px 80px rgba(16, 24, 40, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;

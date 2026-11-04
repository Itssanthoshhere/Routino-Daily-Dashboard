import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: { extend: { colors: { ink: "#132a24", forest: "#173e32", mint: "#d8f0df", cream: "#f7f7f2", line: "#e6e9e2", muted: "#738078", accent: "#d9f379" }, boxShadow: { card: "0 2px 12px rgba(19,42,36,.045)" } } },
  plugins: []
};
export default config;

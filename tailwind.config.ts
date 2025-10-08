import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ["minion-pro", "Georgia", "serif"],
        'serif-display': ["minion-pro-display", "minion-pro", "Georgia", "serif"],
        'serif-caption': ["minion-pro-caption", "minion-pro", "Georgia", "serif"],
        'serif-subhead': ["minion-pro-subhead", "minion-pro", "Georgia", "serif"],
        sans: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;

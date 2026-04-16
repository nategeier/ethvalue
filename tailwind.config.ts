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
        eth: {
          purple: "#627EEA",
          lavender: "#8A9FFF",
          deep: "#3D5AFE",
          glow: "#A78BFA",
          dark: "#0B0B1A",
          darker: "#060610",
          card: "#0F0F2A",
          border: "#1E1E4A",
        },
        gold: {
          DEFAULT: "#F7931A",
          light: "#FFB74D",
        },
      },
      fontFamily: {
        mono: ["var(--font-mono)", "monospace"],
        sans: ["var(--font-sans)", "sans-serif"],
      },
      animation: {
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        "spin-slow": "spin 20s linear infinite",
        "price-tick": "price-tick 0.3s ease-out",
        "gradient-shift": "gradient-shift 8s ease infinite",
        "scanline": "scanline 8s linear infinite",
      },
      keyframes: {
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(98, 126, 234, 0.3), 0 0 40px rgba(98, 126, 234, 0.1)" },
          "50%": { boxShadow: "0 0 40px rgba(98, 126, 234, 0.6), 0 0 80px rgba(98, 126, 234, 0.3)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "33%": { transform: "translateY(-20px) rotate(2deg)" },
          "66%": { transform: "translateY(-10px) rotate(-1deg)" },
        },
        "price-tick": {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.05)" },
          "100%": { transform: "scale(1)" },
        },
        "gradient-shift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "scanline": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
      },
      backgroundImage: {
        "eth-gradient": "linear-gradient(135deg, #627EEA 0%, #A78BFA 50%, #3D5AFE 100%)",
        "dark-mesh": "radial-gradient(at 40% 20%, #1a1a3e 0px, transparent 50%), radial-gradient(at 80% 0%, #0d0d2e 0px, transparent 50%), radial-gradient(at 0% 50%, #0f0f2a 0px, transparent 50%)",
        "card-shine": "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%)",
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        "eth-glow": "0 0 30px rgba(98, 126, 234, 0.4), 0 0 60px rgba(98, 126, 234, 0.2)",
        "eth-glow-lg": "0 0 60px rgba(98, 126, 234, 0.5), 0 0 120px rgba(98, 126, 234, 0.25)",
        "card": "0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
        "green-glow": "0 0 20px rgba(0, 255, 136, 0.3)",
        "red-glow": "0 0 20px rgba(255, 59, 48, 0.3)",
      },
    },
  },
  plugins: [],
};

export default config;

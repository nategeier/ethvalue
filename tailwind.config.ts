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
        surface: {
          0: "#000000",
          1: "#0a0a0a",
          2: "#111111",
          3: "#171717",
          4: "#1f1f1f",
          5: "#2a2a2a",
          6: "#333333",
        },
        ink: {
          DEFAULT: "#ffffff",
          2: "#e5e5e5",
          3: "#a3a3a3",
          4: "#737373",
          5: "#525252",
          6: "#404040",
        },
      },
      animation: {
        "glow-pulse": "glow-pulse 3s ease-in-out infinite",
        "float": "float 7s ease-in-out infinite",
        "spin-slow": "spin 25s linear infinite",
        "price-up": "price-up 0.4s ease-out",
        "price-down": "price-down 0.4s ease-out",
        "scanline": "scanline 10s linear infinite",
        "shimmer": "shimmer 2s linear infinite",
      },
      keyframes: {
        "glow-pulse": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-18px)" },
        },
        "price-up": {
          "0%": { color: "inherit" },
          "40%": { color: "#22c55e" },
          "100%": { color: "inherit" },
        },
        "price-down": {
          "0%": { color: "inherit" },
          "40%": { color: "#ef4444" },
          "100%": { color: "inherit" },
        },
        "scanline": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      boxShadow: {
        "card": "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 4px 24px rgba(0,0,0,0.6)",
        "card-hover": "0 1px 0 0 rgba(255,255,255,0.06) inset, 0 8px 32px rgba(0,0,0,0.7)",
        "white-glow": "0 0 20px rgba(255,255,255,0.08), 0 0 40px rgba(255,255,255,0.04)",
        "white-glow-lg": "0 0 40px rgba(255,255,255,0.12), 0 0 80px rgba(255,255,255,0.06)",
        "green-glow": "0 0 16px rgba(34, 197, 94, 0.25)",
        "red-glow": "0 0 16px rgba(239, 68, 68, 0.25)",
      },
      backgroundImage: {
        "noise": "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};

export default config;

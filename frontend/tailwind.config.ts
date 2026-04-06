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
        primary: {
          DEFAULT: "#2D2C70",
          50: "#EDEDF8",
          100: "#D5D5F0",
          200: "#ABABE1",
          300: "#8181D2",
          400: "#5757C3",
          500: "#2D2C70",
          600: "#252460",
          700: "#1E1D50",
          800: "#161540",
          900: "#0F0E30",
          950: "#070720",
        },
      },
      backgroundColor: {
        base: "#F0F1F5",
        "base-secondary": "#E8E9F3",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      borderRadius: {
        glass: "16px",
        "glass-sm": "12px",
        "glass-lg": "20px",
        "glass-xl": "24px",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(45, 44, 112, 0.06)",
        "glass-lg": "0 16px 48px rgba(45, 44, 112, 0.10)",
        "glass-sm": "0 4px 16px rgba(45, 44, 112, 0.04)",
        "glass-hover": "0 12px 40px rgba(45, 44, 112, 0.08)",
      },
      spacing: {
        sidebar: "16rem",
        "sidebar-collapsed": "5rem",
        topbar: "4rem",
      },
      zIndex: {
        sidebar: "40",
        topbar: "30",
        "modal-backdrop": "50",
        modal: "60",
        toast: "70",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-in-left": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        "fade-in": "fade-in 200ms ease-out",
        "slide-in-left": "slide-in-left 300ms ease-out",
        "scale-in": "scale-in 200ms ease-out",
      },
    },
  },
  plugins: [],
};
export default config;

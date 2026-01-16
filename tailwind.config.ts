import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "#E50914",
          dark: "#B20710",
          light: "#F40612",
        },
        secondary: {
          DEFAULT: "#564d4d",
          light: "#808080",
        },
        netflix: {
          red: "#E50914",
          "red-dark": "#B20710",
          black: "#141414",
          dark: "#181818",
          gray: "#2F2F2F",
        },
        card: {
          DEFAULT: "#181818",
          hover: "#2a2a2a",
        },
      },
      fontFamily: {
        display: ["Bebas Neue", "Inter", "sans-serif"],
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "gradient-red": "linear-gradient(to right, #E50914, #B20710)",
        "gradient-dark": "linear-gradient(to bottom, transparent, #141414)",
        "gradient-vignette": "radial-gradient(ellipse at center, transparent 0%, #141414 100%)",
      },
      animation: {
        "fade-in": "fadeIn 0.25s ease-out forwards",
        "fade-in-up": "fadeInUp 0.4s ease-out forwards",
        "fade-in-down": "fadeInDown 0.4s ease-out forwards",
        "scale-in": "scaleIn 0.25s ease-out forwards",
        "slide-in-left": "slideInLeft 0.4s ease-out forwards",
        "slide-in-right": "slideInRight 0.4s ease-out forwards",
        "shimmer": "shimmer 1.5s infinite",
        "ken-burns": "ken-burns 20s ease-out forwards",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "float": "float 3s ease-in-out infinite",
        // Cinematic animations
        "reveal-up": "revealUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "reveal-left": "revealLeft 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "dramatic-fade": "dramaticFade 0.8s ease-out forwards",
        "cinematic-zoom": "cinematicZoom 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "glow-pulse": "glowPulse 3s ease-in-out infinite",
        "subtle-float": "subtleFloat 6s ease-in-out infinite",
        "spin-slow": "spin 3s linear infinite",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        fadeInUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fadeInDown: {
          from: { opacity: "0", transform: "translateY(-20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        slideInLeft: {
          from: { opacity: "0", transform: "translateX(-30px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        slideInRight: {
          from: { opacity: "0", transform: "translateX(30px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "ken-burns": {
          "0%": { transform: "scale(1)" },
          "100%": { transform: "scale(1.1)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(229, 9, 20, 0.4)" },
          "50%": { boxShadow: "0 0 20px 5px rgba(229, 9, 20, 0.2)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        // Cinematic keyframes
        revealUp: {
          from: { opacity: "0", transform: "translateY(60px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        revealLeft: {
          from: { opacity: "0", transform: "translateX(60px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        dramaticFade: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        cinematicZoom: {
          from: { opacity: "0", transform: "scale(1.1)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        glowPulse: {
          "0%, 100%": { 
            boxShadow: "0 0 20px 0 rgba(229, 9, 20, 0.2)",
            borderColor: "rgba(229, 9, 20, 0.3)",
          },
          "50%": { 
            boxShadow: "0 0 40px 10px rgba(229, 9, 20, 0.3)",
            borderColor: "rgba(229, 9, 20, 0.6)",
          },
        },
        subtleFloat: {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "25%": { transform: "translateY(-5px) rotate(0.5deg)" },
          "75%": { transform: "translateY(5px) rotate(-0.5deg)" },
        },
      },
      transitionTimingFunction: {
        "bounce-in": "cubic-bezier(0.34, 1.56, 0.64, 1)",
        "smooth": "cubic-bezier(0.4, 0, 0.2, 1)",
        "cinematic": "cubic-bezier(0.16, 1, 0.3, 1)",
        "dramatic": "cubic-bezier(0.6, 0, 0.2, 1)",
      },
      transitionDuration: {
        "250": "250ms",
        "400": "400ms",
        "600": "600ms",
        "800": "800ms",
        "1000": "1000ms",
      },
      spacing: {
        "navbar": "68px",
        "18": "4.5rem",
        "22": "5.5rem",
      },
      boxShadow: {
        "card": "0 4px 20px rgba(0, 0, 0, 0.5)",
        "card-hover": "0 8px 40px rgba(0, 0, 0, 0.8)",
        "glow": "0 0 20px rgba(229, 9, 20, 0.3)",
        "glow-lg": "0 0 40px rgba(229, 9, 20, 0.4)",
      },
      zIndex: {
        "60": "60",
        "70": "70",
        "80": "80",
        "90": "90",
        "100": "100",
      },
      scale: {
        "102": "1.02",
        "103": "1.03",
        "140": "1.4",
      },
    },
  },
  plugins: [],
};

export default config;

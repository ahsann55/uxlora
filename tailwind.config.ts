import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand colors
        brand: {
          50:  "#f0eeff",
          100: "#e4e0ff",
          200: "#ccc5ff",
          300: "#ab9eff",
          400: "#8b6eff",
          500: "#7c3aed", // Primary purple
          600: "#6d28d9",
          700: "#5b21b6",
          800: "#4c1d95",
          900: "#3b1678",
          950: "#1e0a4a",
        },
        // UI surface colors (dark theme)
        surface: {
          DEFAULT: "#0f0a1e",  // Page background
          50:  "#1a1235",      // Card background
          100: "#241a47",      // Elevated card
          200: "#2e2259",      // Hover state
          300: "#3d2e70",      // Border
          400: "#4c3a87",      // Subtle border
        },
        // Semantic colors
        success: {
          DEFAULT: "#10b981",
          light:   "#d1fae5",
        },
        warning: {
          DEFAULT: "#f59e0b",
          light:   "#fef3c7",
        },
        error: {
          DEFAULT: "#ef4444",
          light:   "#fee2e2",
        },
        info: {
          DEFAULT: "#3b82f6",
          light:   "#dbeafe",
        },
      },

      fontFamily: {
        sans: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
      },

      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
      },

      borderRadius: {
        lg: "0.625rem",
        xl: "0.875rem",
        "2xl": "1.125rem",
      },

      boxShadow: {
        glow:       "0 0 20px rgba(124, 58, 237, 0.3)",
        "glow-lg":  "0 0 40px rgba(124, 58, 237, 0.4)",
        card:       "0 4px 24px rgba(0, 0, 0, 0.4)",
        "card-hover": "0 8px 40px rgba(0, 0, 0, 0.6)",
      },

      backgroundImage: {
        "gradient-brand":
          "linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #4c1d95 100%)",
        "gradient-surface":
          "linear-gradient(180deg, #1a1235 0%, #0f0a1e 100%)",
        "gradient-card":
          "linear-gradient(135deg, #1a1235 0%, #241a47 100%)",
      },

      animation: {
        "fade-in":     "fadeIn 0.3s ease-in-out",
        "slide-up":    "slideUp 0.3s ease-out",
        "slide-down":  "slideDown 0.3s ease-out",
        "pulse-glow":  "pulseGlow 2s ease-in-out infinite",
        "spin-slow":   "spin 3s linear infinite",
      },

      keyframes: {
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%":   { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          "0%":   { opacity: "0", transform: "translateY(-10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(124, 58, 237, 0.3)" },
          "50%":      { boxShadow: "0 0 40px rgba(124, 58, 237, 0.6)" },
        },
      },

      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
        "sidebar": "16rem",
      },
    },
  },
  plugins: [],
};

export default config;
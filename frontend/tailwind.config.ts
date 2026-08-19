import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/features/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
        },
        violet: {
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
        },
        wpa: {
          primary: "#22B4CD",
          "primary-soft": "rgba(34,180,205,0.12)",
          dark: "#1b1b1b",
          darker: "#111111",
          light: "#f7f7f7",
          gray: "#7a7a7a",
          "gray-soft": "#e2e2e2",
        },
        navy: {
          950: "#020810",
          900: "#050D1A",
          800: "#0B1628",
          700: "#0F1C35",
          600: "#152542",
          500: "#1B2F55",
        },
        cyan: {
          300: "#7EE8FA",
          400: "#5CD9F0",
          500: "#24B4CD",
          600: "#1B9AB0",
        },
        ai: {
          pink: "#E879A0",
          purple: "#A855F7",
          "pink-soft": "rgba(232,121,160,0.14)",
          "purple-soft": "rgba(168,85,247,0.12)",
        },
      },
      backgroundImage: {
        "gradient-brand":
          "linear-gradient(135deg, #0E2A47 0%, #24B4CD 100%)",
        "gradient-brand-soft":
          "linear-gradient(135deg, rgba(14,42,71,0.08) 0%, rgba(36,180,205,0.12) 100%)",
        "gradient-radial":
          "radial-gradient(ellipse at top, rgba(36,180,205,0.08), transparent 60%)",
        "grid-pattern":
          "linear-gradient(rgba(14,42,71,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(14,42,71,0.045) 1px, transparent 1px)",
        "gradient-navy":
          "linear-gradient(180deg, #050D1A 0%, #0F1C35 100%)",
        "gradient-section-dark":
          "linear-gradient(180deg, #0B1628 0%, #0F1C35 60%, #0B1628 100%)",
        "gradient-hero-overlay":
          "linear-gradient(105deg, rgba(5,13,26,0.96) 0%, rgba(11,22,40,0.78) 52%, rgba(11,22,40,0.30) 100%)",
        "gradient-cyan-radial":
          "radial-gradient(ellipse at center, rgba(36,180,205,0.14) 0%, transparent 65%)",
        "gradient-ai-glow":
          "radial-gradient(ellipse at top left, rgba(36,180,205,0.12) 0%, rgba(168,85,247,0.08) 50%, transparent 70%)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        heading: [
          "var(--font-heading)",
          "Manrope",
          "var(--font-sans)",
          "system-ui",
          "sans-serif",
        ],
        body: [
          "var(--font-body)",
          "DM Sans",
          "var(--font-sans)",
          "system-ui",
          "sans-serif",
        ],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "marquee-x": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        "glow-pulse": {
          "0%, 100%": {
            opacity: "0.7",
            boxShadow: "0 0 16px rgba(36,180,205,0.3), 0 0 32px rgba(36,180,205,0.1)",
          },
          "50%": {
            opacity: "1",
            boxShadow: "0 0 28px rgba(36,180,205,0.6), 0 0 56px rgba(36,180,205,0.2)",
          },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 2.4s linear infinite",
        "fade-in": "fade-in 0.45s ease-out",
        "fade-in-up": "fade-in-up 0.6s ease-out both",
        "marquee-x": "marquee-x 28s linear infinite",
        "glow-pulse": "glow-pulse 3s ease-in-out infinite",
        float: "float 4s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;


import { type Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

export default {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
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
          focus: "hsl(var(--primary) / 80%)"
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
        cosmic: {
          '100': 'rgb(226, 232, 240)',
          '200': 'rgb(203, 213, 225)',
          '300': 'rgb(148, 163, 184)',
          '400': 'rgb(100, 116, 139)',
          '500': 'rgb(71, 85, 105)',
          '600': 'rgb(51, 65, 85)',
          '700': 'rgb(30, 41, 59)',
          '800': 'rgb(15, 23, 42)',
          '900': 'rgb(10, 17, 34)',
          '950': 'rgb(2, 6, 23)',
        },
        olive: {
          '400': 'rgb(142, 142, 0)',
          '500': 'rgb(128, 128, 0)',
          '600': 'rgb(114, 114, 0)',
        }
      },
      boxShadow: {
        'glow': '0 0 20px rgba(104, 117, 255, 0.3)',
        'glow-light': '0 0 10px rgba(104, 117, 255, 0.2)'
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
      },
      fontFamily: {
        sans: ["var(--font-sans)", ...fontFamily.sans],
      },
      backgroundImage: {
        'star-field': "url('/src/assets/star-field-bg.jpg')",
        'deep-space': "url('/src/assets/deep-space-bg.jpg')",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

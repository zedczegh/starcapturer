
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				star: '#FFFDF7',
				cosmic: {
					100: 'rgb(226, 232, 240)',
					200: 'rgb(203, 213, 225)',
					300: 'rgb(148, 163, 184)',
					400: 'rgb(100, 116, 139)',
					500: 'rgb(71, 85, 105)',
					600: 'rgb(51, 65, 85)',
					700: 'rgb(30, 41, 59)',
					800: 'rgb(15, 23, 42)',
					900: 'rgb(10, 17, 34)',
					950: 'rgb(2, 6, 23)'
				},
				red: {
					500: 'rgb(239, 68, 68)'
				},
				orange: {
					400: 'rgb(251, 146, 60)'
				},
				yellow: {
					400: 'rgb(250, 204, 21)'
				},
				green: {
					500: 'rgb(34, 197, 94)'
				},
				olive: {
					500: 'rgb(128, 128, 0)'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' },
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' },
				},
				'fade-in': {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' },
				},
				'fade-out': {
					'0%': { opacity: '1' },
					'100%': { opacity: '0' },
				},
				'slide-up': {
					'0%': { transform: 'translateY(10px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' },
				},
				'slide-right': {
					'0%': { transform: 'translateX(-10px)', opacity: '0' },
					'100%': { transform: 'translateX(0)', opacity: '1' },
				},
				'star-pulse': {
					'0%, 100%': { opacity: '1', transform: 'scale(1)' },
					'50%': { opacity: '0.6', transform: 'scale(0.95)' },
				},
				'spin-slow': {
					'0%': { transform: 'rotate(0deg)' },
					'100%': { transform: 'rotate(360deg)' },
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.5s ease-out',
				'fade-out': 'fade-out 0.5s ease-out',
				'slide-up': 'slide-up 0.6s ease-out',
				'slide-right': 'slide-right 0.6s ease-out',
				'star-pulse': 'star-pulse 3s ease-in-out infinite',
				'spin-slow': 'spin-slow 20s linear infinite',
			},
			backgroundImage: {
				'nebula-gradient': 'linear-gradient(145deg, rgba(6,8,24,1) 0%, rgba(26,32,87,0.9) 100%)',
				'cosmic-glow': 'radial-gradient(circle, rgba(104, 117, 255, 0.2) 0%, rgba(6, 8, 24, 0) 70%)',
				'star-field': 'url("/images/stars.png")'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;

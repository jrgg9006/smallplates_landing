import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		fontFamily: {
  			serif: [
  				'minion-pro',
  				'Georgia',
  				'Times New Roman',
  				'serif'
  			],
  			'serif-display': [
  				'minion-pro-display',
  				'minion-pro',
  				'Georgia',
  				'serif'
  			],
  			'serif-caption': [
  				'minion-pro-caption',
  				'minion-pro',
  				'Georgia',
  				'serif'
  			],
  			'serif-subhead': [
  				'minion-pro-subhead',
  				'minion-pro',
  				'Georgia',
  				'serif'
  			],
  			sans: [
  				'var(--font-inter)',
  				'-apple-system',
  				'BlinkMacSystemFont',
  				'sans-serif'
  			],
  			'dm-sans': [
  				'var(--font-dm-sans)',
  				'-apple-system',
  				'sans-serif'
  			]
  		},
  		fontSize: {
  			// Display — hero titulars, landing covers
  			// Fluid from 36px (mobile) to 72px (desktop)
  			'display': ['clamp(2.25rem, 1.75rem + 2.5vw, 4.5rem)', {
  				lineHeight: '1.1',
  				letterSpacing: '-0.02em',
  			}],

  			// Heading — section titles
  			// Fluid from 30px mobile to 48px desktop
  			'heading': ['clamp(1.875rem, 1.5rem + 1.875vw, 3rem)', {
  				lineHeight: '1.15',
  				letterSpacing: '-0.01em',
  			}],

  			// Subheading — card/modal titles, subsection headers
  			// Fluid from 24px mobile to 30px desktop
  			'subheading': ['clamp(1.5rem, 1.375rem + 0.625vw, 1.875rem)', {
  				lineHeight: '1.2',
  				letterSpacing: '0',
  			}],

  			// Body — primary prose (paragraphs, descriptions)
  			// Fixed 16px
  			'body': ['1rem', {
  				lineHeight: '1.65',
  				letterSpacing: '0',
  			}],

  			// Body-lead — lead prose editorial (follows a heading)
  			// Fluid from 18px mobile to 24px desktop
  			'body-lead': ['clamp(1.125rem, 0.9rem + 1.125vw, 1.5rem)', {
  				lineHeight: '1.65',
  				letterSpacing: '0',
  			}],

  			// Body-small — secondary prose (helper text, info boxes)
  			// Fixed 14px
  			'body-small': ['0.875rem', {
  				lineHeight: '1.6',
  				letterSpacing: '0',
  			}],

  			// Caption — metadata, timestamps, small labels
  			// Fixed 12px
  			'caption': ['0.75rem', {
  				lineHeight: '1.5',
  				letterSpacing: '0',
  			}],

  			// Eyebrow — ALL CAPS kickers above headings
  			// Fixed 11px
  			'eyebrow': ['0.6875rem', {
  				lineHeight: '1.4',
  				letterSpacing: '0.15em',
  			}],

  			// Action — buttons, CTAs, navigation
  			// Fixed 15px
  			'action': ['0.9375rem', {
  				lineHeight: '1.0',
  				letterSpacing: '0',
  			}],
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			// Small Plates Brand Colors
  			brand: {
  				'warm-white': 'hsl(var(--brand-warm-white))',
  				'honey': 'hsl(var(--brand-honey))',
  				'honey-dark': 'hsl(var(--brand-honey-dark))',
  				'charcoal': 'hsl(var(--brand-charcoal))',
  				'warm-gray': 'hsl(var(--brand-warm-gray))',
  				'cream': 'hsl(var(--brand-cream))',
  				'sand': 'hsl(var(--brand-sand))',
  				'white': 'hsl(var(--brand-white))',
  				'olive': 'hsl(var(--brand-olive))',
  				'terracotta': 'hsl(var(--brand-terracotta))',
  				'warm-gray-dark': 'hsl(var(--brand-warm-gray-dark))',
  				'warm-gray-light': 'hsl(var(--brand-warm-gray-light))'
  			}
  		}
  	}
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
};
export default config;

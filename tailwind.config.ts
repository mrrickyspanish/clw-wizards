import type { Config } from 'tailwindcss'
import tailwindcssAnimate from 'tailwindcss-animate'

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
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
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar))',
          foreground: 'hsl(var(--sidebar-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
        },
        clw: {
          black: 'rgb(var(--clw-black) / <alpha-value>)',
          'black-2': 'rgb(var(--clw-black-2) / <alpha-value>)',
          'black-3': 'rgb(var(--clw-black-3) / <alpha-value>)',
          gold: 'rgb(var(--clw-gold) / <alpha-value>)',
          'gold-l': 'rgb(var(--clw-gold-l) / <alpha-value>)',
          'gold-dim': 'rgb(var(--clw-gold-dim) / <alpha-value>)',
          'gold-ink': 'rgb(var(--clw-gold-ink) / <alpha-value>)',
          'gold-on-light': 'rgb(var(--clw-gold-on-light) / <alpha-value>)',
          white: 'rgb(var(--clw-white) / <alpha-value>)',
          gray: 'rgb(var(--clw-gray) / <alpha-value>)',
          cream: 'rgb(var(--clw-cream) / <alpha-value>)',
          paper: 'rgb(var(--clw-paper) / <alpha-value>)',
          ink: 'rgb(var(--clw-ink) / <alpha-value>)',
          'muted-dark': 'rgb(var(--clw-muted-dark) / <alpha-value>)',
          warm: '#F6F5F2',
          stone: '#EEECE7',
          'line-light': 'rgba(17, 17, 17, 0.12)',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        display: ['var(--font-bebas)', 'sans-serif'],
        body: ['var(--font-barlow)', 'sans-serif'],
        cond: ['var(--font-barlow-condensed)', 'sans-serif'],
        impact: ['var(--font-big-shoulders)', 'sans-serif'],
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
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [tailwindcssAnimate],
}

export default config

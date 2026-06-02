import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#FFFFFF',
        surface: '#F9F9F9',
        'text-primary': '#171717',
        'text-secondary': '#6E6E73',
        accent: '#0053D6',
        'accent-tint': 'rgba(0, 83, 214, 0.08)',
        'accent-border': 'rgba(0, 83, 214, 0.30)',
        border: 'rgba(23, 23, 23, 0.08)',
        destructive: '#DC2626',
        'destructive-tint': 'rgba(220, 38, 38, 0.08)',
        // Legacy aliases — migrate views incrementally
        ink: '#171717',
        graphite: '#2b2b2b',
        stone: '#6E6E73',
        mist: 'rgba(23, 23, 23, 0.08)',
        paper: '#F9F9F9',
        // Brain graph node colors (domain-specific)
        amber: { brain: '#b45309', 'brain-bg': '#fdf4e7' },
        blue: { brain: '#1d4ed8', 'brain-bg': '#eff6ff' },
        decision: { fg: '#854d0e', bg: '#fefce8' },
      },
      fontFamily: {
        display: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        headline: ['17px', { lineHeight: '1.3', fontWeight: '600' }],
        body: ['15px', { lineHeight: '1.5' }],
        caption: ['12px', { lineHeight: '1.4' }],
        'caption-sm': ['11px', { lineHeight: '1.3' }],
      },
      letterSpacing: {
        section: '0.12em',
      },
      borderRadius: {
        card: '16px',
        pill: '24px',
        bubble: '20px',
      },
      spacing: {
        screen: '20px',
      },
      boxShadow: {
        card: '0 2px 4px rgba(0, 0, 0, 0.04)',
      },
      animation: {
        reveal: 'reveal 0.4s ease both',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        bloom: 'bloom 2s ease-out forwards',
        'orb-pulse': 'orbPulse 2.2s ease-in-out infinite',
      },
      keyframes: {
        reveal: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        bloom: {
          '0%': { opacity: '0.6', r: '0' },
          '100%': { opacity: '0', r: '40' },
        },
        orbPulse: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.85' },
          '50%': { transform: 'scale(1.06)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config

import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#FFFFFF',
        surface: '#F9F9F9',
        'surface-elevated': '#FFFFFF',
        'text-primary': '#171717',
        'text-secondary': '#6E6E73',
        'text-tertiary': '#AEAEB2',
        accent: '#0053D6',
        'accent-tint': 'rgba(0, 83, 214, 0.08)',
        'accent-border': 'rgba(0, 83, 214, 0.30)',
        border: 'rgba(23, 23, 23, 0.08)',
        'border-strong': 'rgba(23, 23, 23, 0.14)',
        destructive: '#DC2626',
        'destructive-tint': 'rgba(220, 38, 38, 0.08)',
        success: '#16A34A',
        'success-tint': 'rgba(22, 163, 74, 0.08)',
        warning: '#D97706',
        'warning-tint': 'rgba(217, 119, 6, 0.08)',
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
        card: '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 4px 16px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04)',
        'card-raised': '0 8px 24px rgba(0, 0, 0, 0.10), 0 2px 8px rgba(0, 0, 0, 0.06)',
        subtle: '0 1px 2px rgba(0, 0, 0, 0.04)',
      },
      animation: {
        reveal: 'reveal 0.4s ease both',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in': 'fadeIn 0.2s ease both',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        bloom: 'bloom 2s ease-out forwards',
        'orb-pulse': 'orbPulse 2.2s ease-in-out infinite',
        shimmer: 'shimmer 1.8s ease-in-out infinite',
        'typewriter-cursor': 'typewriterCursor 0.9s ease-in-out infinite',
      },
      keyframes: {
        reveal: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        bloom: {
          '0%': { opacity: '0.6', r: '0' },
          '100%': { opacity: '0', r: '40' },
        },
        orbPulse: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.85' },
          '50%': { transform: 'scale(1.06)', opacity: '1' },
        },
        typewriterCursor: {
          '0%, 45%': { opacity: '1' },
          '50%, 100%': { opacity: '0.15' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config

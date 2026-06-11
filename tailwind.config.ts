import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--color-canvas)',
        surface: 'var(--color-surface)',
        'surface-elevated': 'var(--color-surface-elevated)',
        'surface-muted': 'var(--color-surface-muted)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-tertiary': 'var(--color-text-tertiary)',
        accent: 'var(--color-accent)',
        'accent-hover': 'var(--color-accent-hover)',
        'accent-tint': 'var(--color-accent-tint)',
        'accent-border': 'var(--color-accent-border)',
        border: {
          DEFAULT: 'var(--color-border)',
          strong: 'var(--color-border-strong)',
        },
        destructive: {
          DEFAULT: 'var(--color-destructive)',
          tint: 'var(--color-destructive-tint)',
        },
        success: {
          DEFAULT: 'var(--color-success)',
          tint: 'var(--color-success-tint)',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
          tint: 'var(--color-warning-tint)',
        },
        brand: {
          50: 'var(--color-brand-50)',
          100: 'var(--color-brand-100)',
          200: 'var(--color-brand-200)',
          300: 'var(--color-brand-300)',
          400: 'var(--color-brand-400)',
          500: 'var(--color-brand-500)',
          600: 'var(--color-brand-600)',
          700: 'var(--color-brand-700)',
          800: 'var(--color-brand-800)',
          900: 'var(--color-brand-900)',
        },
        neutral: {
          50: 'var(--color-neutral-50)',
          100: 'var(--color-neutral-100)',
          200: 'var(--color-neutral-200)',
          300: 'var(--color-neutral-300)',
          400: 'var(--color-neutral-400)',
          500: 'var(--color-neutral-500)',
          600: 'var(--color-neutral-600)',
          700: 'var(--color-neutral-700)',
          800: 'var(--color-neutral-800)',
          900: 'var(--color-neutral-900)',
        },
        amber: { brain: 'var(--color-node-amber)', 'brain-bg': 'var(--color-node-amber-bg)' },
        blue: { brain: 'var(--color-node-blue)', 'brain-bg': 'var(--color-node-blue-bg)' },
        decision: { fg: 'var(--color-node-decision-fg)', bg: 'var(--color-node-decision-bg)' },
      },
      fontFamily: {
        display: 'var(--font-display)',
        mono: 'var(--font-mono)',
      },
      fontSize: {
        'display-xl': ['var(--text-display-xl)', { lineHeight: '1.1', fontWeight: '600', letterSpacing: '-0.03em' }],
        'display-lg': ['var(--text-display-lg)', { lineHeight: '1.15', fontWeight: '600', letterSpacing: '-0.02em' }],
        'display-md': ['var(--text-display-md)', { lineHeight: '1.2', fontWeight: '600', letterSpacing: '-0.02em' }],
        headline: ['var(--text-headline)', { lineHeight: '1.3', fontWeight: '600' }],
        body: ['var(--text-body)', { lineHeight: '1.5' }],
        caption: ['var(--text-caption)', { lineHeight: '1.4' }],
        'caption-sm': ['var(--text-caption-sm)', { lineHeight: '1.3' }],
      },
      letterSpacing: {
        section: '0.12em',
      },
      borderRadius: {
        card: 'var(--radius-card)',
        pill: 'var(--radius-pill)',
        bubble: 'var(--radius-bubble)',
      },
      spacing: {
        screen: 'var(--space-screen)',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        'card-hover': 'var(--shadow-card-hover)',
        'card-raised': 'var(--shadow-card-raised)',
        subtle: 'var(--shadow-subtle)',
      },
      transitionDuration: {
        fast: 'var(--duration-fast)',
        normal: 'var(--duration-normal)',
        slow: 'var(--duration-slow)',
      },
      transitionTimingFunction: {
        out: 'var(--ease-out)',
        spring: 'var(--spring)',
      },
      animation: {
        reveal: 'reveal var(--duration-slow) var(--ease-out) both',
        'slide-up': 'slideUp var(--duration-normal) var(--ease-out) both',
        'fade-in': 'fadeIn var(--duration-fast) ease both',
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

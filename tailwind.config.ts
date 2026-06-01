import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0a0a0a',
        graphite: '#2b2b2b',
        stone: '#6b6b6b',
        mist: '#e6e6e6',
        paper: '#fafafa',
        canvas: '#f8f8f8',
        amber: { brain: '#b45309', 'brain-bg': '#fdf4e7' },
        blue: { brain: '#1d4ed8', 'brain-bg': '#eff6ff' },
        decision: { fg: '#854d0e', bg: '#fefce8' },
      },
      fontFamily: {
        display: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      letterSpacing: {
        tightest: '-0.04em',
      },
      animation: {
        reveal: 'reveal 0.4s ease both',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bloom': 'bloom 2s ease-out forwards',
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
      },
    },
  },
  plugins: [],
} satisfies Config

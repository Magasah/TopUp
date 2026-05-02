import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Base canvas
        ink: {
          950: '#0a0a0b',
          900: '#0e0e12',
          800: '#15151b',
          700: '#1c1d25',
          600: '#262830',
          500: '#3a3c47',
        },
        // Neon palette
        neon: {
          blue: '#00d4ff',     // Electric Blue
          magenta: '#ff2bd6',  // Magenta
          green: '#39ff7a',    // Acid Green
          violet: '#9d6bff',
          amber: '#ffb547',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Display',
          'SF Pro Text',
          'Inter',
          'Segoe UI',
          'system-ui',
          'sans-serif',
        ],
        display: [
          'SF Pro Display',
          '-apple-system',
          'Inter',
          'system-ui',
          'sans-serif',
        ],
        mono: ['SF Mono', 'JetBrains Mono', 'Menlo', 'monospace'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      backdropBlur: {
        xs: '2px',
        '4xl': '72px',
      },
      boxShadow: {
        // iOS Liquid Glass shadows
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.45), inset 0 1px 0 0 rgba(255,255,255,0.08)',
        'glass-lg': '0 24px 64px -12px rgba(0,0,0,0.6), inset 0 1px 0 0 rgba(255,255,255,0.1)',
        'glass-inset': 'inset 0 1px 1px rgba(255,255,255,0.12), inset 0 -1px 1px rgba(0,0,0,0.4)',
        // Neon glows
        'neon-blue': '0 0 24px rgba(0,212,255,0.55), 0 0 64px rgba(0,212,255,0.25)',
        'neon-magenta': '0 0 24px rgba(255,43,214,0.55), 0 0 64px rgba(255,43,214,0.25)',
        'neon-green': '0 0 24px rgba(57,255,122,0.5), 0 0 64px rgba(57,255,122,0.22)',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.04)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'aurora-shift': {
          '0%, 100%': { transform: 'translate(0,0) scale(1)' },
          '33%': { transform: 'translate(8%, -6%) scale(1.05)' },
          '66%': { transform: 'translate(-6%, 4%) scale(0.97)' },
        },
        'border-spin': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'pulse-glow': 'pulse-glow 3.2s ease-in-out infinite',
        shimmer: 'shimmer 2.4s linear infinite',
        float: 'float 5s ease-in-out infinite',
        'aurora-shift': 'aurora-shift 18s ease-in-out infinite',
        'border-spin': 'border-spin 6s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;

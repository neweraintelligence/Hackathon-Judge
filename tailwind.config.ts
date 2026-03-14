import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/_clients/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        purple: {
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        cursor: {
          bg: '#0a0a0f',
          surface: '#13131a',
          border: '#1e1e2e',
          muted: '#2a2a3e',
          accent: '#7c3aed',
        },
      },
      backgroundImage: {
        'cursor-gradient': 'linear-gradient(135deg, #0a0a0f 0%, #13131a 50%, #0d0d1a 100%)',
        'purple-glow': 'radial-gradient(circle at 50% 50%, rgba(124, 58, 237, 0.15) 0%, transparent 70%)',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(124, 58, 237, 0.4)',
        'glow-sm': '0 0 10px rgba(124, 58, 237, 0.3)',
        'glow-lg': '0 0 40px rgba(124, 58, 237, 0.5)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.4)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(124, 58, 237, 0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(124, 58, 237, 0.6)' },
        },
      },
    },
  },
  plugins: [],
}
export default config

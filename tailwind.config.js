/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/renderer/index.html',
    './src/renderer/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg:          '#0B0D11',
        surface:     '#131720',
        'surface-2': '#1A2030',
        'surface-3': '#222840',
        border:      '#252D40',
        accent:      '#C0873A',
        'text-primary':   '#DCE2EF',
        'text-secondary': '#5E6E96',
        'text-muted':     '#363F58',
        health: {
          green: '#3A9A65',
          amber: '#C88A20',
          red:   '#B84040',
        },
      },
      fontFamily: {
        display: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        ui:      ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-dot': 'pulse-dot 2s ease-in-out infinite',
      },
      keyframes: {
        'pulse-dot': {
          '0%, 100%': { boxShadow: '0 0 4px currentColor' },
          '50%':      { boxShadow: '0 0 12px currentColor' },
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

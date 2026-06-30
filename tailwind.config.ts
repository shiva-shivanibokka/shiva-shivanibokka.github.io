import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: '#0B0A12',
        surface: '#16141F',
        text: '#ECE6DD',
        muted: '#C8C1D5',
        primary: '#8B7BFF', // violet
        warm: '#FF8A6B', // coral
        mint: '#46E0D0', // terminal-signal accent
      },
      fontFamily: {
        display: ['"Bungee Shade"', 'cursive'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config

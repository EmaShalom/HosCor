import type { Config } from 'tailwindcss'
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#1E3A5F', light: '#2A5080', dark: '#162D4A' },
        brand: { DEFAULT: '#2563EB', light: '#3B82F6', dark: '#1D4ED8' },
        success: '#16A34A',
        warn: '#EA580C',
        danger: '#DC2626',
        purple: '#7C3AED',
        teal: '#0D9488',
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
} satisfies Config

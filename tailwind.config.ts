import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        surface: {
          light: '#ffffff',
          lightAlt: '#f8faf9',
          lightMuted: '#f1f4f2',
          dark: '#121a16',
          darkAlt: '#18241f',
          darkMuted: '#0d1511',
        },
      },
      fontFamily: {
        display: ['Oswald', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '8px',
        md: '10px',
        lg: '14px',
        xl: '18px',
        '2xl': '22px',
        '3xl': '28px',
      },
      boxShadow: {
        subtle: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        card: '0 4px 12px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -2px rgba(0, 0, 0, 0.03)',
        cardDark: '0 8px 24px -4px rgba(0, 0, 0, 0.4), 0 4px 12px -4px rgba(0, 0, 0, 0.3)',
      },
      minHeight: {
        12: '48px',
        14: '56px',
        16: '64px',
        18: '72px',
      },
    },
  },
  plugins: [],
} satisfies Config;

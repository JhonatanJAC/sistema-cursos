/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        blue: {
          50: '#f0f8ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#1d68d8', // Primary FECIP Blue (from logo)
          700: '#1552b8', // Darker FECIP Blue
          800: '#114294', // Deep Navy
          900: '#0f3470',
          950: '#0a234e',
        },
        primary: {
          50: '#f0f8ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#1d68d8',
          700: '#1552b8',
          800: '#114294',
          900: '#0f3470',
          950: '#0a234e',
        },
        fecip: {
          blue: '#1d68d8',
          dark: '#114294',
          sky: '#38bdf8',
          cyan: '#7dd3fc',
          ice: '#e0f2fe',
        },
        sidebar: {
          bg: '#ffffff',
          hover: '#f0f8ff',
          active: '#1d68d8',
          text: '#64748b',
          textActive: '#ffffff',
          border: '#e2e8f0',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-in': 'slideIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

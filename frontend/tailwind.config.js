/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        vault: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        }
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['Syne', 'sans-serif'],
      },
      backdropBlur: { xl: '20px' },
      borderRadius: { '2xl': '16px', '3xl': '24px' },
      boxShadow: {
        green: '0 4px 24px rgba(74, 222, 128, 0.2)',
        'green-lg': '0 8px 40px rgba(74, 222, 128, 0.3)',
      }
    },
  },
  plugins: [],
};

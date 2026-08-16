/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#081526',
          800: '#0d2138',
          700: '#143352',
        },
        gold: {
          500: '#c99732',
          600: '#ad7b22',
        },
      },
      boxShadow: {
        soft: '0 18px 45px rgba(8, 21, 38, 0.12)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f3faf4',
          100: '#e3f4e6',
          200: '#c8e8ce',
          300: '#9dd5a8',
          400: '#6aba7b',
          500: '#3f9654',
          600: '#2f7a42',
          700: '#276137',
          800: '#224e2e',
          900: '#1d4127',
        },
        ink: {
          50: '#f7f8f7',
          100: '#eceeed',
          200: '#d5dad7',
          300: '#b0b9b4',
          400: '#84928b',
          500: '#66766e',
          600: '#505e57',
          700: '#424d47',
          800: '#38403c',
          900: '#303733',
        },
      },
      fontFamily: {
        sans: ['"Source Sans 3"', 'Segoe UI', 'system-ui', 'sans-serif'],
        display: ['"Source Sans 3"', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        panel: '0 8px 30px rgba(32, 48, 38, 0.08)',
        soft: '0 2px 10px rgba(32, 48, 38, 0.06)',
      },
    },
  },
  plugins: [],
};

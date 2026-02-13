/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: '#C6FF4A',
        'accent-dark': '#9FCC3B',
      },
      fontFamily: {
        sans: ['Afacad', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

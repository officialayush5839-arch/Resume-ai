/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'soft-green': '#A7C4AA',
        'dark-green': '#2E4C33',
        'light-green': '#D9E6D7',
      },
    },
  },
  plugins: [],
}

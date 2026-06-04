/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: '#1a5c2a',
        leaf: '#4caf50',
        gold: '#f5a623',
      },
    },
  },
  plugins: [],
}

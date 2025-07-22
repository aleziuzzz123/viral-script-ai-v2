/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-background': '#100C14',
        'brand-container': '#1A1620',
        'brand-accent': '#A3FF00', // Lime Green
        'brand-accent-secondary': '#F9F871', // Cyber Yellow
        'brand-text-primary': '#FFFFFF',
        'brand-text-secondary': '#A8A2B3',
      }
    },
  },
  plugins: [],
}

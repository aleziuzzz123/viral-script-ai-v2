/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-background': '#120F1A', // Rich Dark Purple
        'brand-container': '#1E1A2A',
        'brand-accent': '#F43F5E',     // Magenta Pink
        'brand-text-primary': '#F0F2F5',
        'brand-text-secondary': '#A09CB0',
        'brand-border': '#2D283D',
      }
    },
  },
  plugins: [],
}

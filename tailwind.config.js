/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-background': '#4B1D5E', // Refined Rich Purple (deep, elegant)
        'brand-container': '#1F172A',  // Dark Purple, good for UI containers
        'brand-accent': '#EC4899',     // Vibrant Pink (eye-catching yet balanced)
        'brand-text-primary': '#F9FAFB', // Crisp White (high readability)
        'brand-text-secondary': '#C4B5FD', // Soft Lavender (complements primary text)
        'brand-border': '#372549',     // Muted Purple (clean separation)
      }
    },
  },
  plugins: [],
}

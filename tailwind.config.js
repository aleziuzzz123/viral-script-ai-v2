/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-background': '#3C096C',     // Deep Vibrant Purple (fresh and professional)
        'brand-container': '#240046',      // Darker Purple (rich, elegant containers)
        'brand-accent': '#FF6DC1',         // Lighter Pink Accent (brighter, more engaging CTA)
        'brand-text-primary': '#FFFFFF',   // Pure White (maximum readability)
        'brand-text-secondary': '#E0AAFF', // Soft Lilac (light secondary text)
        'brand-border': '#5A189A',         // Medium Purple Border (clear, attractive separation)
      }
    },
  },
  plugins: [],
}

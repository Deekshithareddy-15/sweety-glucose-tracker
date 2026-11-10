/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          pink: '#F9A8D4',       // Soft pastel pink
          pinkLight: '#FDF2F8',  // Very soft pink background
          lavender: '#C4B5FD',   // Pastel lavender
          lavenderLight: '#F5F3FF',
          mint: '#6EE7B7',       // Pastel mint
          mintLight: '#ECFDF5',
          navy: '#334155',       // Deep accessible text
          muted: '#64748B'       // Accessible secondary text
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

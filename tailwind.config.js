/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './*.{js,ts,jsx,tsx}', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Noto Sans SC', 'ui-sans-serif', 'system-ui']
      },
      colors: {
        ink: '#1f2937',
        paper: '#fffaf0',
        saffron: '#f59e0b',
        ocean: '#2563eb',
        mint: '#14b8a6',
        rosewood: '#9f1239'
      }
    }
  },
  plugins: []
}

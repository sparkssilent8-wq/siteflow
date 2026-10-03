/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        siteflow: {
          bg: '#0A0D0B',
          bgSubtle: '#111613',
          greenDeep: '#0C2119',
          emerald: '#16382A',
          amber: '#D98A32',
          amberBright: '#F2A84B',
          cream: '#F1EDE4',
          muted: '#9B9B91',
          mint: '#8BE0C0',
          border: 'rgba(217, 138, 50, 0.2)',
          borderSubtle: 'rgba(241, 237, 228, 0.08)',
          card: '#0E1310',
          cardLight: '#141B16',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Space Grotesk', 'Inter', 'sans-serif']
      }
    },
  },
  plugins: [],
}

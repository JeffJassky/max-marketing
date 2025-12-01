/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{vue,ts,tsx,js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        friendly: ['Nunito', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      colors: {
        amplify: {
          green: '#c3fd34',
          secondary: '#6366f1',
          purple: '#7c3aed',
          dark: '#0f172a',
          darker: '#020617'
        }
      }
    }
  },
  plugins: []
};

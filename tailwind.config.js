/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta agro / tambo
        campo: {
          50: '#f3f8f1',
          100: '#e3efdd',
          200: '#c7dfbd',
          300: '#a0c78f',
          400: '#74a95e',
          500: '#528c3d',
          600: '#3e6f2e',
          700: '#325827',
          800: '#2a4722',
          900: '#243b1e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

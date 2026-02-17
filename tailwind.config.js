/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./*.html",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6', // Bright Blue from logo
        secondary: '#FB923C', // Warm Orange from logo
      },
      fontFamily: {
        'sans': ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(to right, var(--tw-gradient-stops))',
      }
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 60px rgba(99, 102, 241, 0.22)',
        soft: '0 20px 80px rgba(15, 23, 42, 0.18)',
      },
      backgroundImage: {
        aurora:
          'radial-gradient(circle at 10% 15%, rgba(99, 102, 241, 0.35), transparent 28%), radial-gradient(circle at 90% 8%, rgba(236, 72, 153, 0.25), transparent 24%), radial-gradient(circle at 55% 88%, rgba(34, 211, 238, 0.18), transparent 25%)',
      },
    },
  },
  plugins: [],
};

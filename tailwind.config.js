/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
        heading: ["Space Grotesk", "ui-sans-serif", "system-ui"],
      },
      colors: {
        "dante-bg": "#0F0E17",
        "dante-primary": "#6C63FF",
        "dante-secondary": "#2D2B55",
        "dante-accent": "#FF6584",
        "dante-text": "#FFFFFE",
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.5s ease-in-out',
      },
      boxShadow: {
        glass: "0 0 0 1px rgba(255,255,255,0.08), 0 8px 30px rgba(0,0,0,0.35)",
      },
    },
  },
  plugins: [],
}


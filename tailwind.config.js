/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Roboto', 'system-ui', 'sans-serif'],
        heading: ["Space Grotesk", "ui-sans-serif", "system-ui"],
      },
      colors: {
        md: {
          primary: '#6750A4',
          'on-primary': '#FFFFFF',
          'secondary-container': '#E8DEF8',
          'on-secondary-container': '#1D192B',
          tertiary: '#7D5260',
          background: '#FFFBFE',
          'on-background': '#1C1B1F',
          'surface-container': '#F3EDF7',
          'surface-variant': '#E7E0EC',
          border: '#79747E',
          'on-surface-variant': '#49454F',
        },
        "dante-bg": "#0F0E17",
        "dante-primary": "#6C63FF",
        "dante-secondary": "#2D2B55",
        "dante-accent": "#FF6584",
        "dante-text": "#FFFFFE",
      },
      borderRadius: {
        'md-sm': '12px',
        'md-md': '16px',
        'md-lg': '24px',
        'md-xl': '28px',
        'md-2xl': '32px',
        'md-3xl': '48px',
      },
      transitionTimingFunction: {
        'md-standard': 'cubic-bezier(0.2, 0, 0, 1)',
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

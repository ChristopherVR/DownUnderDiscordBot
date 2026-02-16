/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        spotify: {
          green: '#1DB954',
          'green-light': '#1ED760',
          black: '#191414',
          'dark-gray': '#121212',
          gray: '#282828',
          'light-gray': '#B3B3B3',
          white: '#FFFFFF',
        },
        surface: '#0f0f14',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      backdropBlur: {
        '3xl': '64px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 8s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 8s ease-in-out 2s infinite',
        'gradient-shift': 'gradientShift 10s ease infinite',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        glowPulse: {
          from: { opacity: '0.4' },
          to: { opacity: '0.8' },
        },
      },
      boxShadow: {
        'glow-green': '0 0 25px rgba(29, 185, 84, 0.3)',
        'glow-green-lg': '0 0 40px rgba(29, 185, 84, 0.25), 0 0 80px rgba(29, 185, 84, 0.1)',
      },
    },
  },
  plugins: [],
};

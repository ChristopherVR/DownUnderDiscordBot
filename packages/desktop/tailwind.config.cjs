/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['selector', '[data-mode="dark"]'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Theme-aware accent via CSS variables
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          light: 'var(--accent-light)',
        },
        // Semantic surfaces
        surface: 'var(--surface)',
        // Legacy spotify aliases — still valid when accent is "green"
        spotify: {
          green: '#1DB954',
          'green-light': '#1ED760',
          black: '#191414',
          'dark-gray': '#121212',
          gray: '#282828',
          'light-gray': '#B3B3B3',
          white: '#FFFFFF',
        },
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
        'now-playing-bar': 'nowPlayingBar 1s ease-in-out infinite alternate',
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
        nowPlayingBar: {
          '0%': { height: '20%' },
          '100%': { height: '100%' },
        },
      },
      boxShadow: {
        'glow-green': '0 0 25px var(--accent-glow)',
        'glow-green-lg': '0 0 40px var(--accent-glow), 0 0 80px color-mix(in srgb, var(--accent-glow) 40%, transparent)',
        'glow-accent': '0 0 25px var(--accent-glow)',
        'glow-accent-lg': '0 0 40px var(--accent-glow), 0 0 80px color-mix(in srgb, var(--accent-glow) 40%, transparent)',
      },
    },
  },
  plugins: [],
};

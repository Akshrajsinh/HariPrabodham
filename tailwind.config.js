/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        saffron: {
          DEFAULT: '#FF6B1A',
          50: '#FFF4EB',
          100: '#FFE4D1',
          200: '#FFC4A3',
          300: '#FFA075',
          400: '#FF7D47',
          500: '#FF6B1A',
          600: '#E84E00',
          700: '#B83A00',
          800: '#882A00',
          900: '#581A00',
        },
        marigold: {
          DEFAULT: '#FFA733',
          light: '#FFD08A',
        },
        cream: '#FFFFFF',
        night: {
          DEFAULT: '#251206',
          soft: '#331808',
          deep: '#170A03',
        },
        brass: '#F3C34F',
        emerald: '#10B981',
        kumkum: '#EF4444',
      },
      fontFamily: {
        display: ['"Cinzel"', 'serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
        score: ['"Poppins"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 12px 40px 0 rgba(0,0,0,0.5)',
        glow: '0 0 50px rgba(255,107,26,0.65)',
        'glow-gold': '0 0 45px rgba(255,167,51,0.55)',
        'glow-green': '0 0 50px rgba(16,185,129,0.7)',
        'glow-red': '0 0 50px rgba(239,68,68,0.65)',
      },
      backgroundImage: {
        'radial-glow': 'radial-gradient(circle at 50% 15%, rgba(255,107,26,0.35) 0%, rgba(255,167,51,0.15) 45%, transparent 80%)',
        'arch-gradient': 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%)',
        'gold-gradient': 'linear-gradient(135deg, #FFFFFF 0%, #FFE2B3 40%, #FFA733 100%)',
        'saffron-gradient': 'linear-gradient(135deg, #FFC4A3 0%, #FF6B1A 50%, #E84E00 100%)',
      },
      borderRadius: {
        arch: '50% 50% 16px 16px / 25% 25% 16px 16px',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0) translateX(0)' },
          '50%': { transform: 'translateY(-24px) translateX(12px)' },
        },
        flicker: {
          '0%, 100%': { transform: 'scaleY(1) scaleX(1)', opacity: '1' },
          '25%': { transform: 'scaleY(1.1) scaleX(0.95)', opacity: '0.92' },
          '50%': { transform: 'scaleY(0.92) scaleX(1.05)', opacity: '1' },
          '75%': { transform: 'scaleY(1.06) scaleX(0.97)', opacity: '0.95' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.7', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.02)' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        flicker: 'flicker 1.4s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

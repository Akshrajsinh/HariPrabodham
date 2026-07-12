/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        saffron: {
          DEFAULT: '#FF6B1A',
          50: '#FFF3EA',
          100: '#FFE2CC',
          200: '#FFC599',
          300: '#FFA766',
          400: '#FF8940',
          500: '#FF6B1A',
          600: '#E85400',
          700: '#B84300',
          800: '#883200',
          900: '#582100',
        },
        marigold: {
          DEFAULT: '#FFA733',
          light: '#FFD08A',
        },
        cream: '#FFF8ED',
        night: {
          DEFAULT: '#1A0E0A',
          soft: '#2A1712',
          deep: '#0F0704',
        },
        brass: '#D4A94A',
        emerald: '#16A34A',
        kumkum: '#DC2626',
      },
      fontFamily: {
        display: ['"Cinzel"', 'serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
        score: ['"Poppins"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0,0,0,0.35)',
        glow: '0 0 40px rgba(255,167,51,0.45)',
        'glow-green': '0 0 40px rgba(22,163,74,0.55)',
        'glow-red': '0 0 40px rgba(220,38,38,0.5)',
      },
      backgroundImage: {
        'radial-glow': 'radial-gradient(circle at 50% 0%, rgba(255,167,51,0.25), transparent 60%)',
        'arch-gradient': 'linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.03) 100%)',
      },
      borderRadius: {
        arch: '50% 50% 12px 12px / 30% 30% 12px 12px',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0) translateX(0)' },
          '50%': { transform: 'translateY(-20px) translateX(10px)' },
        },
        flicker: {
          '0%, 100%': { transform: 'scaleY(1) scaleX(1)', opacity: '1' },
          '25%': { transform: 'scaleY(1.08) scaleX(0.96)', opacity: '0.92' },
          '50%': { transform: 'scaleY(0.95) scaleX(1.04)', opacity: '1' },
          '75%': { transform: 'scaleY(1.05) scaleX(0.98)', opacity: '0.95' },
        },
        'petal-fall': {
          '0%': { transform: 'translateY(-10vh) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(110vh) rotate(360deg)', opacity: '0.3' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        flicker: 'flicker 1.4s ease-in-out infinite',
        'petal-fall': 'petal-fall linear forwards',
      },
    },
  },
  plugins: [],
}

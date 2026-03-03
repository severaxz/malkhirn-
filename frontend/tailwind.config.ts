import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:          '#09090A',
        'bg-2':      '#0D0D0F',
        surface:     '#111113',
        'surface-2': '#181819',
        'surface-3': '#1E1E20',
        border:      '#222224',
        'border-2':  '#2E2E32',

        accent: {
          DEFAULT: '#C41E1E',
          hover:   '#D42828',
          muted:   'rgba(196,30,30,0.12)',
          border:  'rgba(196,30,30,0.28)',
        },

        yes: {
          DEFAULT: '#00C076',
          hover:   '#00D882',
          muted:   'rgba(0,192,118,0.10)',
          border:  'rgba(0,192,118,0.24)',
        },
        no: {
          DEFAULT: '#FF4D4D',
          hover:   '#FF6464',
          muted:   'rgba(255,77,77,0.10)',
          border:  'rgba(255,77,77,0.24)',
        },
        warn: '#F59E0B',

        ink: {
          DEFAULT: '#FFFFFF',
          '2':     '#A0A0B0',
          '3':     '#606070',
          '4':     '#303038',
        },
      },

      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Inter', 'SF Pro Text', 'system-ui', 'sans-serif'],
      },

      fontSize: {
        '2xs': ['10px', { lineHeight: '14px', letterSpacing: '0.03em' }],
        xs:    ['12px', { lineHeight: '16px', letterSpacing: '0.01em' }],
        sm:    ['13px', { lineHeight: '18px' }],
        base:  ['15px', { lineHeight: '22px' }],
        md:    ['17px', { lineHeight: '24px' }],
        lg:    ['20px', { lineHeight: '28px', letterSpacing: '-0.01em' }],
        xl:    ['24px', { lineHeight: '32px', letterSpacing: '-0.02em' }],
        '2xl': ['30px', { lineHeight: '38px', letterSpacing: '-0.025em' }],
      },

      borderRadius: {
        sm:    '8px',
        DEFAULT: '12px',
        lg:    '16px',
        xl:    '20px',
        '2xl': '24px',
        full:  '9999px',
      },

      boxShadow: {
        card:        '0 1px 3px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03)',
        'card-hover':'0 4px 20px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)',
        accent:      '0 0 24px rgba(196,30,30,0.30)',
        yes:         '0 0 20px rgba(0,192,118,0.18)',
        no:          '0 0 20px rgba(255,77,77,0.18)',
        modal:       '0 32px 80px rgba(0,0,0,0.9)',
      },

      backgroundImage: {
        'accent-grad': 'linear-gradient(135deg, #8B0000 0%, #C41E1E 100%)',
        'yes-grad':    'linear-gradient(135deg, #00A060 0%, #00D882 100%)',
        'no-grad':     'linear-gradient(135deg, #CC2222 0%, #FF6464 100%)',
        'shine':       'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 50%)',
        'glow-top':    'radial-gradient(ellipse 80% 35% at 50% 0%, rgba(196,30,30,0.10) 0%, transparent 70%)',
      },

      animation: {
        'fade-in':  'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.28s cubic-bezier(0.16,1,0.3,1)',
        'scale-in': 'scaleIn 0.22s cubic-bezier(0.16,1,0.3,1)',
        'shimmer':  'shimmer 1.6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' },                              to: { opacity: '1' } },
        slideUp: { from: { transform: 'translateY(14px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        scaleIn: { from: { transform: 'scale(0.95)', opacity: '0' },    to: { transform: 'scale(1)', opacity: '1' } },
        shimmer: { '0%,100%': { opacity: '0.4' }, '50%': { opacity: '0.9' } },
      },
    },
  },
  plugins: [],
} satisfies Config

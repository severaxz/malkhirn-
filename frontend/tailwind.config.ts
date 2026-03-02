import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:          '#09090E',
        'bg-2':      '#0D0D14',
        surface:     '#111118',
        'surface-2': '#16161F',
        'surface-3': '#1C1C27',
        border:      '#1E1E2C',
        'border-2':  '#28283A',

        accent: {
          DEFAULT: '#7C5CF6',
          hover:   '#9070FA',
          muted:   'rgba(124,92,246,0.12)',
          border:  'rgba(124,92,246,0.28)',
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
          '2':     '#9898B4',
          '3':     '#555570',
          '4':     '#2E2E42',
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
        card:       '0 1px 2px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
        'card-hover':'0 4px 20px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.07)',
        accent:     '0 0 28px rgba(124,92,246,0.22)',
        yes:        '0 0 20px rgba(0,192,118,0.18)',
        no:         '0 0 20px rgba(255,77,77,0.18)',
        modal:      '0 32px 80px rgba(0,0,0,0.8)',
      },

      backgroundImage: {
        'accent-grad': 'linear-gradient(135deg, #6644E8 0%, #9B6BFF 100%)',
        'yes-grad':    'linear-gradient(135deg, #00A060 0%, #00D882 100%)',
        'no-grad':     'linear-gradient(135deg, #CC2222 0%, #FF6464 100%)',
        'shine':       'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 50%)',
        'glow-top':    'radial-gradient(ellipse 80% 30% at 50% 0%, rgba(124,92,246,0.08) 0%, transparent 70%)',
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

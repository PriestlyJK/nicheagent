import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Ink (black tones)
        ink:       '#0f0f0f',
        'ink-soft': '#1a1a1a',

        // Surface (backgrounds)
        surface: {
          soft:   '#F2F0EB',
          muted:  '#f8f8f7',
          border: 'rgba(0,0,0,0.10)',
        },

        // Text
        text: {
          primary:   '#0f0f0f',
          secondary: '#6b6b6b',
          tertiary:  '#9b9b9b',
        },

        // Accent — purple (main brand)
        accent: {
          purple:       '#534AB7',
          'purple-light': '#EEEDFE',
          'purple-mid':   '#AFA9EC',
          'purple-dark':  '#3C3489',

          // Coral / signal
          coral:       '#D85A30',
          'coral-light': '#FAECE7',
          'coral-dark':  '#4A1B0C',

          // Green / trend
          green:       '#1D9E75',
          'green-light': '#E1F5EE',
          'green-dark':  '#173404',

          // Amber / warn
          amber:       '#BA7517',
          'amber-light': '#FAEEDA',
          'amber-dark':  '#412402',

          // Red / danger
          red:       '#E24B4A',
          'red-light': '#FCEBEB',
          'red-dark':  '#501313',

          // Blue / info
          blue:       '#185FA5',
          'blue-light': '#E6F1FB',
          'blue-dark':  '#042C53',
        },
      },
      borderRadius: {
        xl:  '12px',
        '2xl': '16px',
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '14px' }],
      },
    },
  },
  plugins: [],
}

export default config

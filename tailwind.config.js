const colors = require('tailwindcss/colors')

module.exports = {
  mode: 'jit',
  purge: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class', // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        'scaffold': '#2e2e2e',
        'primary': '#3b3b3b',
        'card': '#404040',
        'button': '#07c700',
        'secondary': colors.purple[700]
      },
      minWidth: {
        'card': '350px',
        'users-list': '250px',
        'user-mobile': '56px'
      },
      minHeight: {
        'appbar': '48px',
      },
      transitionDelay: {
        '2500': '2500ms'
      }
    },
  },
  variants: {
    extend: {
      brightness: ['hover', 'focus']
    },
  },
  plugins: [],
  important: true
}

/** @type {import('tailwindcss').Config} */
const { frappe, latte, macchiato, mocha } = require('@catppuccin/tailwindcss')

module.exports = {
  content: [
    './app/views/**/*.html.erb',
    './app/helpers/**/*.rb',
    './app/assets/stylesheets/**/*.css',
    './app/javascript/**/*.js'
  ],
  theme: {
    extend: {
      colors: {
        accent: 'var(--accent-color)',
        'accent-hover': 'var(--accent-color-hover)'
      },
      backgroundColor: {
        base: 'var(--color-base)',
        mantle: 'var(--color-mantle)',
        crust: 'var(--color-crust)',
        surface0: 'var(--color-surface0)',
        surface1: 'var(--color-surface1)',
        surface2: 'var(--color-surface2)',
        accent: 'var(--accent-color)',
        'accent-hover': 'var(--accent-color-hover)'
      },
      textColor: {
        primary: 'var(--color-text)',
        secondary: 'var(--color-subtext1)',
        tertiary: 'var(--color-subtext0)',
        accent: 'var(--accent-color)'
      },
      borderColor: {
        subtle: 'var(--color-surface2)',
        default: 'var(--color-overlay0)',
        emphasis: 'var(--color-overlay2)',
        accent: 'var(--accent-color)',
        red: 'var(--color-red)',
        green: 'var(--color-green)'
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('daisyui'),
    require('@catppuccin/tailwindcss')({
      defaultFlavour: 'frappe'
    })
  ],
  daisyui: {
    themes: [...require('@catppuccin/daisyui')],
    darkTheme: 'frappe'
  }
}

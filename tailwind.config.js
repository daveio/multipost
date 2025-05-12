/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/views/**/*.html.erb',
    './app/helpers/**/*.rb',
    './app/javascript/**/*.js',
    './app/assets/stylesheets/**/*.css',
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('@catppuccin/tailwindcss')({
      defaultFlavor: 'frappe'
    }),
    require('daisyui')
  ],
  daisyui: {
    themes: [
      {
        latte: require('@catppuccin/daisyui').latte,
        frappe: require('@catppuccin/daisyui').frappe,
        macchiato: require('@catppuccin/daisyui').macchiato,
        mocha: require('@catppuccin/daisyui').mocha,
      },
    ],
    darkTheme: "frappe",
  },
}

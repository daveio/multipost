import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  connect() {
    // Check if there's a theme set in localStorage
    const savedTheme = localStorage.getItem('theme') || 'frappe'

    // Set the initial theme
    this.setTheme({ currentTarget: { dataset: { setTheme: savedTheme } } })

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if (!localStorage.getItem('theme')) {
        const newTheme = e.matches ? "frappe" : "latte"
        this.setTheme({ currentTarget: { dataset: { setTheme: newTheme } } })
      }
    })
  }

  setTheme(event) {
    const theme = event.currentTarget.dataset.setTheme
    if (!theme) return

    // Store the selected theme in localStorage
    localStorage.setItem('theme', theme)

    // Apply the theme to the document
    document.documentElement.setAttribute('data-theme', theme)

    // Also apply the legacy theme class for any non-DaisyUI components
    document.body.classList.remove('theme-latte', 'theme-frappe', 'theme-macchiato', 'theme-mocha')
    document.body.classList.add(`theme-${theme}`)
  }
}
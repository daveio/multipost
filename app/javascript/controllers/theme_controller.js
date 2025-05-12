import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["toggle", "selector"]

  connect() {
    this.loadThemePreference()
  }

  toggle() {
    const currentTheme = document.documentElement.getAttribute('data-theme')
    const newTheme = currentTheme === 'frappe' ? 'latte' : 'frappe'

    this.applyTheme(newTheme)
    localStorage.setItem('theme', newTheme)
  }

  select(event) {
    const selectedTheme = event.target.value
    if (selectedTheme) {
      this.applyTheme(selectedTheme)
      localStorage.setItem('theme', selectedTheme)
    }
  }

  loadThemePreference() {
    // Default to frappe (dark) unless explicitly set to light
    const savedTheme = localStorage.getItem('theme') || 'frappe'
    this.applyTheme(savedTheme)

    // Update selector if it exists
    if (this.hasSelectorTarget) {
      this.selectorTarget.value = savedTheme
    }
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme)

    // Update any toggle buttons
    if (this.hasToggleTarget) {
      const isDark = theme === 'frappe'
      this.toggleTargets.forEach(target => {
        target.setAttribute('aria-checked', isDark.toString())
      })
    }

    // Update selector if it exists
    if (this.hasSelectorTarget) {
      this.selectorTarget.value = theme
    }
  }
}

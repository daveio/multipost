import { Controller } from '@hotwired/stimulus'

export default class extends Controller {
  static targets = ['input', 'counter', 'limit', 'progress']
  static values = {
    platform: String,
    maxLength: Number,
    warningThreshold: { type: Number, default: 80 }
  }

  connect() {
    this.update()
  }

  update() {
    const currentLength = this.inputTarget.value.length
    const maxLength = this.maxLengthValue
    const percent = Math.min(Math.round((currentLength / maxLength) * 100), 100)

    this.counterTarget.textContent = currentLength

    if (this.hasLimitTarget) {
      this.limitTarget.textContent = maxLength
    }

    if (this.hasProgressTarget) {
      this.progressTarget.style.width = `${percent}%`

      // Reset classes
      this.progressTarget.classList.remove('bg-green-500', 'bg-yellow-500', 'bg-red-500')

      // Add appropriate color based on percentage
      if (percent >= this.warningThresholdValue) {
        if (percent >= 100) {
          this.progressTarget.classList.add('bg-red-500')
        } else {
          this.progressTarget.classList.add('bg-yellow-500')
        }
      } else {
        this.progressTarget.classList.add('bg-green-500')
      }
    }

    // Dispatch a custom event with character count info
    this.dispatch('count', {
      detail: {
        platform: this.platformValue,
        current: currentLength,
        limit: maxLength,
        percent: percent
      }
    })
  }
}

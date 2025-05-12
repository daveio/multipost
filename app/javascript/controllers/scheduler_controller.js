import { Controller } from '@hotwired/stimulus'

export default class extends Controller {
  static targets = ['options', 'staggerOptions']

  connect() {
    // Set min date to now + 5 minutes
    const now = new Date()
    now.setMinutes(now.getMinutes() + 5)

    const datetimeInput = document.getElementById('scheduled_at')
    if (datetimeInput) {
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')

      datetimeInput.min = `${year}-${month}-${day}T${hours}:${minutes}`
    }
  }

  toggleScheduling(event) {
    const checked = event.target.checked

    if (checked) {
      this.optionsTarget.classList.remove('hidden')

      // Set default time to now + 1 hour
      const defaultTime = new Date()
      defaultTime.setHours(defaultTime.getHours() + 1)

      const year = defaultTime.getFullYear()
      const month = String(defaultTime.getMonth() + 1).padStart(2, '0')
      const day = String(defaultTime.getDate()).padStart(2, '0')
      const hours = String(defaultTime.getHours()).padStart(2, '0')
      const minutes = String(defaultTime.getMinutes()).padStart(2, '0')

      document.getElementById('scheduled_at').value = `${year}-${month}-${day}T${hours}:${minutes}`
    } else {
      this.optionsTarget.classList.add('hidden')
      document.getElementById('scheduled_at').value = ''
    }
  }

  toggleStaggering(event) {
    const checked = event.target.checked

    if (checked) {
      this.staggerOptionsTarget.classList.remove('hidden')
    } else {
      this.staggerOptionsTarget.classList.add('hidden')
    }
  }
}

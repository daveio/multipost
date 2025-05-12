import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["menu"]
  
  connect() {
    // Close the dropdown when clicking outside
    this.outsideClickHandler = this.handleOutsideClick.bind(this)
    document.addEventListener('click', this.outsideClickHandler)
  }
  
  disconnect() {
    // Clean up the event listener when the controller is disconnected
    document.removeEventListener('click', this.outsideClickHandler)
  }
  
  toggle(event) {
    event.stopPropagation()
    this.menuTarget.classList.toggle('hidden')
  }
  
  close() {
    this.menuTarget.classList.add('hidden')
  }
  
  handleOutsideClick(event) {
    // Close the dropdown when clicking outside it
    if (!this.element.contains(event.target) && !this.menuTarget.classList.contains('hidden')) {
      this.close()
    }
  }
}
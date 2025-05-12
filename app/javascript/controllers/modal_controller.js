import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["container"]
  
  connect() {
    // Prevent clicking inside the modal from closing it
    this.containerTarget.addEventListener('click', e => {
      e.stopPropagation()
    })
    
    // Close modal when clicking outside
    this.element.addEventListener('click', () => {
      this.close()
    })
    
    // Prevent scrolling of body
    document.body.style.overflow = 'hidden'
  }
  
  disconnect() {
    // Re-enable scrolling when modal is removed
    document.body.style.overflow = ''
  }
  
  close() {
    this.element.remove()
  }
}
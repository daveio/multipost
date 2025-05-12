import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["platform", "hiddenInput", "accountsList"]
  
  connect() {
    // Initialize the hidden input with the current selection
    this.updateHiddenInput()
  }
  
  toggle(event) {
    const platform = event.currentTarget
    const platformId = platform.dataset.platformId
    
    // Toggle the selected class
    platform.classList.toggle("selected")
    
    // Show/hide the accounts list if it exists
    const accountsListId = `${platformId}-accounts`
    const accountsList = this.accountsListTargets.find(list => list.id === accountsListId)
    
    if (accountsList) {
      if (platform.classList.contains("selected")) {
        accountsList.classList.remove("hidden")
      } else {
        accountsList.classList.add("hidden")
        
        // Uncheck all account checkboxes for this platform
        const checkboxes = accountsList.querySelectorAll('input[type="checkbox"]')
        checkboxes.forEach(checkbox => {
          checkbox.checked = false
        })
      }
    }
    
    this.updateHiddenInput()
  }
  
  updateHiddenInput() {
    // Create an array of platform selections
    const selections = this.platformTargets.map(platform => {
      const platformId = platform.dataset.platformId
      const isSelected = platform.classList.contains("selected")
      
      // Find the accounts list for this platform
      const accountsListId = `${platformId}-accounts`
      const accountsList = this.accountsListTargets.find(list => list.id === accountsListId)
      
      // If there's an accounts list, get the selected account IDs
      let accountIds = []
      if (accountsList) {
        const checkboxes = accountsList.querySelectorAll('input[type="checkbox"]:checked')
        accountIds = Array.from(checkboxes).map(checkbox => checkbox.value)
      }
      
      return {
        id: platformId,
        isSelected: isSelected,
        accounts: accountIds
      }
    })
    
    // Update the hidden input with the JSON string
    this.hiddenInputTarget.value = JSON.stringify(selections)
  }
}
import { Controller } from '@hotwired/stimulus'

export default class extends Controller {
  static targets = ['content', 'submitButton', 'splitButton', 'submitForm', 'charStats', 'preview', 'previewTab']

  static values = {
    exceedsLimit: { type: Boolean, default: false }
  }

  connect() {
    // Keep track of character stats for each platform
    this.characterStats = {}

    // Check if we should disable the submit button initially
    this.checkSubmitButton()
  }

  // When content changes
  contentChanged() {
    // Check if we should disable the submit button
    this.checkSubmitButton()

    // Update the preview if visible
    this.updatePreview()
  }

  // Handle character count events from character counter controllers
  handleCharCount(event) {
    const { platform, current, limit, percent } = event.detail

    // Store the stats for this platform
    this.characterStats[platform] = { current, limit, percent }

    // Update the exceedsLimit value
    this.exceedsLimitValue = Object.values(this.characterStats).some((stat) => stat.percent > 100)

    // Show or hide the split button based on whether any platform exceeds its limit
    if (this.hasSplitButtonTarget) {
      this.splitButtonTarget.classList.toggle('hidden', !this.exceedsLimitValue)
    }

    // Update the submit button state
    this.checkSubmitButton()
  }

  checkSubmitButton() {
    if (!this.hasSubmitButtonTarget) return

    const hasContent = this.contentTarget.value.trim().length > 0
    const withinLimits = !this.exceedsLimitValue

    // Enable the submit button only if there's content and no platform exceeds its limit
    this.submitButtonTarget.disabled = !(hasContent && withinLimits)
  }

  // Switch between preview tabs
  switchPreviewTab(event) {
    const tabId = event.currentTarget.dataset.tabId

    // Update active tab state
    this.previewTabTargets.forEach((tab) => {
      const isActive = tab.dataset.tabId === tabId
      tab.classList.toggle('bg-surface1', isActive)
      tab.classList.toggle('text-primary', isActive)
      tab.classList.toggle('bg-surface0', !isActive)
      tab.classList.toggle('text-secondary', !isActive)
      tab.setAttribute('aria-selected', isActive)
    })

    // Update preview content
    this.updatePreview(tabId)
  }

  // Update the preview content
  updatePreview(tabId = null) {
    if (!this.hasPreviewTarget) return

    // If no tabId is provided, use the currently active tab
    if (!tabId) {
      const activeTab = this.previewTabTargets.find((tab) => tab.getAttribute('aria-selected') === 'true')

      if (activeTab) {
        tabId = activeTab.dataset.tabId
      }
    }

    // Get the content from the textarea
    const content = this.contentTarget.value

    if (!content) {
      this.previewTarget.innerHTML = '<p class="text-tertiary">Your post preview will appear here...</p>'
      return
    }

    // Format the content differently based on the platform
    let formattedContent = content

    // Replace newlines with <br> tags
    formattedContent = formattedContent.replace(/\n/g, '<br>')

    // Create hashtag and mention links
    formattedContent = formattedContent.replace(/#(\w+)/g, '<span class="text-accent">#$1</span>')
    formattedContent = formattedContent.replace(/@(\w+)/g, '<span class="text-blue">@$1</span>')

    this.previewTarget.innerHTML = formattedContent

    // Optimize for the specific platform
    this.optimizeForPlatform(tabId)
  }

  optimizeForPlatform(platformId) {
    if (!platformId || !this.hasPreviewTarget) return

    const content = this.contentTarget.value
    if (!content) return

    // Check if we have character stats for this platform and we're close to the limit
    const stats = this.characterStats[platformId]
    if (stats && stats.percent > 70 && stats.percent < 100) {
      // Show optimization suggestion
      const optimizeButton = document.createElement('button')
      optimizeButton.classList.add(
        'mt-4',
        'px-3',
        'py-1',
        'bg-surface1',
        'hover:bg-surface2',
        'text-sm',
        'text-primary',
        'rounded-full',
        'flex',
        'items-center'
      )
      optimizeButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-1">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
        </svg>
        Optimize for ${platformId}
      `
      optimizeButton.setAttribute('data-platform', platformId)
      optimizeButton.setAttribute('data-action', 'click->post-composer#optimizePost')

      // Add to the preview
      const optimizeContainer = document.createElement('div')
      optimizeContainer.classList.add('optimize-suggestion')
      optimizeContainer.appendChild(optimizeButton)

      // Remove any existing suggestion
      const existingSuggestion = this.previewTarget.querySelector('.optimize-suggestion')
      if (existingSuggestion) {
        existingSuggestion.remove()
      }

      this.previewTarget.appendChild(optimizeContainer)
    }
  }

  // Show the thread creation interface
  createThread() {
    // Get the content and construct initial thread posts
    const content = this.contentTarget.value
    const threadPosts = [{ content }]

    // Create a modal for thread creation
    this.createThreadModal(threadPosts)
  }

  createThreadModal(threadPosts) {
    const modalHtml = `
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" 
           data-controller="modal"
           data-action="keydown.escape->modal#close">
        <div class="bg-base rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
             data-modal-target="container">
          <div class="thread-manager" data-controller="thread-manager" data-thread-manager-active-index-value="0">
            <!-- Thread modal content would be inserted here -->
          </div>
        </div>
      </div>
    `

    // Insert the modal into the DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml)

    // This would typically fetch and render the thread manager partial
    // For simplicity, we'll just dispatch an event
    this.dispatch('createThread', {
      detail: {
        content: this.contentTarget.value,
        posts: threadPosts
      }
    })
  }

  // Handle the split post request
  splitPost() {
    // Get the content and selected platforms
    const content = this.contentTarget.value

    // Determine which platform is exceeding limits the most
    let targetPlatform = null
    let highestPercent = 0

    Object.entries(this.characterStats).forEach(([platform, stats]) => {
      if (stats.percent > highestPercent) {
        highestPercent = stats.percent
        targetPlatform = platform
      }
    })

    if (!targetPlatform) {
      // Default to the first platform
      targetPlatform = Object.keys(this.characterStats)[0]
    }

    // Show loading state
    this.splitButtonTarget.disabled = true
    this.splitButtonTarget.innerHTML = `
      <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Splitting...
    `

    // Call the API
    fetch('/posts/split', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
      },
      body: JSON.stringify({
        content: content,
        platform_id: targetPlatform,
        strategies: ['semantic', 'retain_hashtags']
      })
    })
      .then((response) => response.json())
      .then((data) => {
        // Reset button state
        this.resetSplitButton()

        if (data.success) {
          // Open the AI split preview modal
          this.openSplitPreviewModal(data, targetPlatform)
        } else {
          alert(`Error: ${data.error || 'Failed to split post'}`)
        }
      })
      .catch((error) => {
        this.resetSplitButton()
        console.error('Error splitting post:', error)
        alert('Failed to split post. Please try again.')
      })
  }

  resetSplitButton() {
    this.splitButtonTarget.disabled = false
    this.splitButtonTarget.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 mr-2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
      </svg>
      Split with AI
    `
  }

  openSplitPreviewModal(data, platformId) {
    // Create a modal with the split preview
    const splitPosts = data.splits
    const reasoning = data.reasoning

    // Create the modal HTML
    const modalHtml = `
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" 
           id="ai-split-modal"
           data-controller="modal"
           data-action="keydown.escape->modal#close">
        <div class="bg-base rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
             data-modal-target="container">
           
          <div class="flex justify-between items-center px-6 py-4 border-b border-subtle">
            <h2 class="text-xl font-medium text-primary">Split post with AI</h2>
            <button type="button" 
                    class="text-tertiary hover:text-primary"
                    data-action="modal#close">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div class="overflow-y-auto flex-grow p-6">
            <div class="mb-8">
              <h3 class="text-lg font-medium text-primary mb-2">Split Preview for ${platformId.charAt(0).toUpperCase() + platformId.slice(1)}</h3>
              <p class="text-secondary mb-4">Here's how your content will be split into multiple posts.</p>
              
              <div class="space-y-4 split-preview">
                ${splitPosts
                  .map(
                    (post, index) => `
                  <div class="bg-surface1 p-4 rounded-lg shadow-sm">
                    <div class="flex justify-between items-center mb-2">
                      <div class="text-sm text-secondary">Post ${index + 1}/${splitPosts.length}</div>
                      <div class="text-xs text-tertiary">${post.character_count} characters</div>
                    </div>
                    <p class="text-primary">${post.content}</p>
                  </div>
                `
                  )
                  .join('')}
              </div>
            </div>
            
            <div>
              <h3 class="text-lg font-medium text-primary mb-2">AI Reasoning</h3>
              <div class="bg-surface1 p-4 rounded-lg">
                <p class="text-primary">${reasoning}</p>
              </div>
            </div>
          </div>
          
          <div class="px-6 py-4 border-t border-subtle flex justify-end space-x-4">
            <button type="button" 
                    class="bg-surface1 hover:bg-surface2 text-primary py-2 px-4 rounded-lg"
                    data-action="modal#close">
              Cancel
            </button>
            
            <button type="button" 
                    class="bg-accent hover:bg-accent-hover text-white py-2 px-4 rounded-lg"
                    id="apply-split-button"
                    data-platform="${platformId}"
                    data-action="click->post-composer#applyThreadSplit">
              Create Thread
            </button>
          </div>
        </div>
      </div>
    `

    // Add the modal to the page
    document.body.insertAdjacentHTML('beforeend', modalHtml)

    // Store the split data
    this.splitData = {
      platform: platformId,
      posts: splitPosts
    }
  }

  applyThreadSplit(event) {
    // Get the platform from the button's data attribute
    const platformId = event.currentTarget.dataset.platform

    if (!this.splitData || this.splitData.platform !== platformId) {
      console.error('Split data missing or platform mismatch')
      return
    }

    // Create a thread from the split posts
    const threadPosts = this.splitData.posts.map((post) => ({
      content: post.content
    }))

    // Close the modal
    const modal = document.getElementById('ai-split-modal')
    if (modal) {
      modal.remove()
    }

    // Create the thread modal
    this.createThreadModal(threadPosts)
  }

  optimizePost(event) {
    const platformId = event.currentTarget.dataset.platform
    const content = this.contentTarget.value

    if (!platformId || !content) return

    // Show loading state
    event.currentTarget.disabled = true
    event.currentTarget.innerHTML = `
      <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Optimizing...
    `

    // Call the API
    fetch('/posts/optimize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
      },
      body: JSON.stringify({
        content: content,
        platform_id: platformId
      })
    })
      .then((response) => response.json())
      .then((data) => {
        // Reset button state
        const button = event.currentTarget
        button.disabled = false
        button.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-1">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
        </svg>
        Optimize for ${platformId}
      `

        if (data.success) {
          // Show a confirmation dialog with the optimized content
          this.showOptimizationDialog(data, platformId)
        } else {
          alert(`Error: ${data.error || 'Failed to optimize post'}`)
        }
      })
      .catch((error) => {
        console.error('Error optimizing post:', error)
        alert('Failed to optimize post. Please try again.')

        // Reset button state
        const button = event.currentTarget
        button.disabled = false
        button.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-1">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
        </svg>
        Optimize for ${platformId}
      `
      })
  }

  showOptimizationDialog(data, platformId) {
    // Create a modal with the optimized content
    const optimizedContent = data.optimized_content
    const reasoning = data.reasoning

    // Create the modal HTML
    const modalHtml = `
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" 
           id="optimization-modal"
           data-controller="modal"
           data-action="keydown.escape->modal#close">
        <div class="bg-base rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
             data-modal-target="container">
           
          <div class="flex justify-between items-center px-6 py-4 border-b border-subtle">
            <h2 class="text-xl font-medium text-primary">Optimized for ${platformId.charAt(0).toUpperCase() + platformId.slice(1)}</h2>
            <button type="button" 
                    class="text-tertiary hover:text-primary"
                    data-action="modal#close">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div class="overflow-y-auto flex-grow p-6">
            <div class="mb-6">
              <h3 class="text-lg font-medium text-primary mb-2">Optimized Content</h3>
              <div class="bg-surface1 p-4 rounded-lg">
                <p class="text-primary">${optimizedContent}</p>
              </div>
            </div>
            
            <div>
              <h3 class="text-lg font-medium text-primary mb-2">AI Reasoning</h3>
              <div class="bg-surface1 p-4 rounded-lg">
                <p class="text-primary">${reasoning}</p>
              </div>
            </div>
          </div>
          
          <div class="px-6 py-4 border-t border-subtle flex justify-end space-x-4">
            <button type="button" 
                    class="bg-surface1 hover:bg-surface2 text-primary py-2 px-4 rounded-lg"
                    data-action="modal#close">
              Cancel
            </button>
            
            <button type="button" 
                    class="bg-accent hover:bg-accent-hover text-white py-2 px-4 rounded-lg"
                    data-content="${optimizedContent.replace(/"/g, '&quot;')}"
                    data-action="click->post-composer#applyOptimizedContent">
              Use Optimized Content
            </button>
          </div>
        </div>
      </div>
    `

    // Add the modal to the page
    document.body.insertAdjacentHTML('beforeend', modalHtml)
  }

  applyOptimizedContent(event) {
    // Get the optimized content from the button's data attribute
    const optimizedContent = event.currentTarget.dataset.content

    if (optimizedContent) {
      // Update the textarea
      this.contentTarget.value = optimizedContent

      // Trigger input event to update character counts and preview
      this.contentTarget.dispatchEvent(new Event('input', { bubbles: true }))
    }

    // Close the modal
    const modal = document.getElementById('optimization-modal')
    if (modal) {
      modal.remove()
    }
  }

  saveAsDraft() {
    const content = this.contentTarget.value
    if (!content.trim()) {
      alert('Please enter some content before saving as a draft.')
      return
    }

    // Get platform selections
    const platformSelections = document.querySelector('input[name="post[platform_selections]"]').value

    // Create a form to submit the draft
    const form = document.createElement('form')
    form.method = 'POST'
    form.action = '/drafts'
    form.style.display = 'none'

    // Add CSRF token
    const csrfToken = document.querySelector('meta[name="csrf-token"]').content
    const csrfInput = document.createElement('input')
    csrfInput.type = 'hidden'
    csrfInput.name = 'authenticity_token'
    csrfInput.value = csrfToken
    form.appendChild(csrfInput)

    // Add content
    const contentInput = document.createElement('input')
    contentInput.type = 'hidden'
    contentInput.name = 'draft[content]'
    contentInput.value = content
    form.appendChild(contentInput)

    // Add platform selections
    const platformInput = document.createElement('input')
    platformInput.type = 'hidden'
    platformInput.name = 'draft[platform_selections]'
    platformInput.value = platformSelections
    form.appendChild(platformInput)

    // Add to the document and submit
    document.body.appendChild(form)
    form.submit()
  }
}

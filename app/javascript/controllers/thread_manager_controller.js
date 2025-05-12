import { Controller } from '@hotwired/stimulus'

export default class extends Controller {
  static targets = ['container', 'post', 'template', 'activeIndex']

  static values = {
    maxPosts: { type: Number, default: 10 },
    activeIndex: { type: Number, default: 0 }
  }

  connect() {
    if (this.hasActiveIndexTarget) {
      this.activeIndexTarget.value = this.activeIndexValue
    }

    this.updatePostIndicators()
  }

  // Switch to a different post in the thread
  switchPost(event) {
    const index = Number.parseInt(event.currentTarget.dataset.index, 10)
    this.activeIndexValue = index

    if (this.hasActiveIndexTarget) {
      this.activeIndexTarget.value = index
    }

    // Update the active post
    this.postTargets.forEach((post, i) => {
      post.classList.toggle('hidden', i !== index)
    })

    this.updatePostIndicators()
  }

  // Add a new post to the thread
  addPost() {
    // Check if we've reached the maximum number of posts
    if (this.postTargets.length >= this.maxPostsValue) {
      alert(`You can only create a maximum of ${this.maxPostsValue} posts in a thread.`)
      return
    }

    // Clone the template
    const template = this.templateTarget
    const newPost = template.cloneNode(true)
    newPost.classList.remove('hidden')
    newPost.id = `thread-post-${this.postTargets.length}`

    // Update the post number and add the thread notation
    const textarea = newPost.querySelector('textarea')
    if (textarea) {
      textarea.value = this.generateThreadNotation(this.postTargets.length + 1)
    }

    // Add the new post to the container
    this.containerTarget.appendChild(newPost)

    // Switch to the new post
    this.activeIndexValue = this.postTargets.length - 1

    if (this.hasActiveIndexTarget) {
      this.activeIndexTarget.value = this.activeIndexValue
    }

    this.updatePostIndicators()

    // Focus the new textarea
    if (textarea) {
      textarea.focus()
    }
  }

  // Remove a post from the thread
  removePost(event) {
    const index = Number.parseInt(event.currentTarget.dataset.index, 10)

    // Don't allow removing the first post if it's the only one
    if (this.postTargets.length <= 1 && index === 0) {
      return
    }

    // Remove the post
    const post = this.postTargets[index]
    post.remove()

    // If we removed the active post, switch to another one
    if (index === this.activeIndexValue) {
      this.activeIndexValue = Math.max(0, index - 1)

      if (this.hasActiveIndexTarget) {
        this.activeIndexTarget.value = this.activeIndexValue
      }
    }
    // If we removed a post before the active one, update the active index
    else if (index < this.activeIndexValue) {
      this.activeIndexValue -= 1

      if (this.hasActiveIndexTarget) {
        this.activeIndexTarget.value = this.activeIndexValue
      }
    }

    this.updatePostIndicators()
  }

  // Update thread indicators on all posts
  updatePostIndicators() {
    const totalPosts = this.postTargets.length

    this.postTargets.forEach((post, index) => {
      // Update post number and navigation button state
      const postNumber = post.querySelector('.post-number')
      if (postNumber) {
        postNumber.textContent = `${index + 1}/${totalPosts}`
      }

      // Highlight the active post
      post.classList.toggle('active', index === this.activeIndexValue)

      // Update the textarea with thread notation
      const textarea = post.querySelector('textarea')
      if (textarea) {
        const content = textarea.value

        // Replace or add thread notation
        const withoutNotation = this.removeThreadNotation(content)
        textarea.value = withoutNotation + this.generateThreadNotation(index + 1, totalPosts)
      }
    })

    // Update navigation buttons
    const navButtons = this.element.querySelectorAll('.thread-nav-button')
    navButtons.forEach((button, index) => {
      button.classList.toggle('active', index === this.activeIndexValue)
    })
  }

  // Remove thread notation from content
  removeThreadNotation(content) {
    // Match thread notation pattern like "🧵 1/3" at the end of the text
    const notationRegex = /\n\n🧵\s+\d+\/\d+$/
    return content.replace(notationRegex, '')
  }

  // Generate thread notation
  generateThreadNotation(index, total = null) {
    if (!total) {
      total = this.postTargets.length
    }
    return `\n\n🧵 ${index}/${total}`
  }

  // Exit thread mode
  exitThread() {
    this.dispatch('exitThread')
  }
}

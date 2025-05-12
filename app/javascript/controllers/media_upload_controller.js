import { Controller } from '@hotwired/stimulus'

export default class extends Controller {
  static targets = ['input', 'fileList', 'dropzone', 'progress', 'container']

  static values = {
    uploadUrl: String,
    draftId: { type: String, default: '' },
    postId: { type: String, default: '' },
    maxFiles: { type: Number, default: 4 },
    maxSize: { type: Number, default: 10 * 1024 * 1024 } // 10MB default
  }

  connect() {
    // Initialize uploaded files array
    this.uploadedFiles = []

    // Set up the drag and drop listeners if we have a dropzone
    if (this.hasDropzoneTarget) {
      this.setupDragAndDrop()
    }

    // Show container if there are files
    this.updateContainerVisibility()
  }

  setupDragAndDrop() {
    const dropzone = this.dropzoneTarget

    // Prevent default behavior (prevent file from being opened)
    dropzone.addEventListener('dragover', (event) => {
      event.preventDefault()
      dropzone.classList.add('border-accent', 'bg-surface0')
    })

    dropzone.addEventListener('dragleave', (event) => {
      event.preventDefault()
      dropzone.classList.remove('border-accent', 'bg-surface0')
    })

    // Handle drop
    dropzone.addEventListener('drop', (event) => {
      event.preventDefault()
      dropzone.classList.remove('border-accent', 'bg-surface0')

      if (event.dataTransfer.files) {
        this.handleFiles(event.dataTransfer.files)
      }
    })
  }

  triggerFileInput() {
    this.inputTarget.click()
  }

  // Handle file selection from the input element
  filesSelected() {
    this.handleFiles(this.inputTarget.files)
  }

  // Process the selected files
  handleFiles(files) {
    if (!files || files.length === 0) return

    // Check if adding these files would exceed the max
    const currentCount = this.uploadedFiles.length
    const newCount = currentCount + files.length

    if (newCount > this.maxFilesValue) {
      alert(`You can only upload a maximum of ${this.maxFilesValue} files.`)
      return
    }

    // Upload each file
    Array.from(files).forEach((file) => {
      // Check file size
      if (file.size > this.maxSizeValue) {
        alert(`File ${file.name} is too large. Maximum file size is ${this.formatFileSize(this.maxSizeValue)}.`)
        return
      }

      // Check file type
      if (!/^(image|video)\//i.test(file.type)) {
        alert(`File ${file.name} is not a supported media type. Please upload images or videos.`)
        return
      }

      this.uploadFile(file)
    })

    // Clear the input so the same file can be selected again
    this.inputTarget.value = ''

    // Show container if there are files
    this.updateContainerVisibility()
  }

  uploadFile(file) {
    // Create a form data object to send the file
    const formData = new FormData()
    formData.append('file', file)

    // Add the draft or post ID if available
    if (this.draftIdValue) {
      formData.append('draft_id', this.draftIdValue)
    } else if (this.postIdValue) {
      formData.append('post_id', this.postIdValue)
    }

    // Show upload progress
    let progressBar = null
    if (this.hasProgressTarget) {
      const progressContainer = this.progressTarget.cloneNode(true)
      progressContainer.classList.remove('hidden')
      progressContainer.classList.add('uploading-' + this.uploadedFiles.length)

      const label = progressContainer.querySelector('.progress-label')
      if (label) {
        label.textContent = `Uploading ${file.name}...`
      }

      progressBar = progressContainer.querySelector('div > div')
      this.element.appendChild(progressContainer)
    }

    // Upload the file
    fetch(this.uploadUrlValue, {
      method: 'POST',
      body: formData,
      headers: {
        'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
      }
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          // Add the file to the list of uploaded files
          this.uploadedFiles.push(data.media_file)

          // Add the file to the preview
          this.addFileToPreview(data.media_file)

          // Dispatch an event to notify other controllers
          this.dispatch('fileUploaded', { detail: data.media_file })
        } else {
          throw new Error(data.errors ? data.errors.join(', ') : 'Upload failed')
        }
      })
      .catch((error) => {
        console.error('Error uploading file:', error)
        alert(`Error uploading ${file.name}: ${error.message}`)
      })
      .finally(() => {
        // Remove the progress bar
        if (progressBar) {
          const container = progressBar.closest('div[class^="uploading-"]')
          if (container) {
            container.remove()
          }
        }

        // Update container visibility
        this.updateContainerVisibility()
      })
  }

  addFileToPreview(file) {
    if (!this.hasFileListTarget) return

    // Create the file element
    const fileElement = document.createElement('div')
    fileElement.classList.add('media-file', 'relative', 'rounded-lg', 'overflow-hidden', 'border', 'border-subtle')
    fileElement.dataset.fileId = file.id

    // Check if it's an image
    const isImage = file.file_type.startsWith('image/')

    if (isImage && file.preview_url) {
      // Image preview
      fileElement.innerHTML = `
        <div class="relative group">
          <img src="${file.preview_url}" alt="${file.name}" class="w-full h-32 object-cover" />
          <div class="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <a href="${file.url}" target="_blank" class="p-2 rounded-full bg-surface1 text-primary hover:bg-surface2 mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </a>
          </div>
        </div>
        <div class="absolute bottom-0 left-0 right-0 bg-surface0 bg-opacity-75 text-primary text-xs p-1 truncate">
          ${file.name}
        </div>
        <button type="button" data-action="media-upload#removeFile" data-file-id="${file.id}" 
                class="absolute top-2 right-2 bg-red text-white rounded-full w-6 h-6 flex items-center justify-center">
          &times;
        </button>
      `
    } else if (file.file_type.startsWith('video/')) {
      // Video preview
      fileElement.innerHTML = `
        <div class="relative">
          <div class="flex items-center justify-center w-full h-32 bg-surface1">
            <div class="text-center relative">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="mx-auto h-12 w-12 text-blue">
                <path stroke-linecap="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
              </svg>
              <span class="absolute bottom-0 left-0 right-0 text-xs text-blue">Video</span>
            </div>
          </div>
          <div class="absolute bottom-0 left-0 right-0 bg-surface0 bg-opacity-75 text-primary text-xs p-1 truncate">
            ${file.name}
          </div>
          <button type="button" data-action="media-upload#removeFile" data-file-id="${file.id}" 
                  class="absolute top-2 right-2 bg-red text-white rounded-full w-6 h-6 flex items-center justify-center">
            &times;
          </button>
        </div>
      `
    } else {
      // Generic file preview
      fileElement.innerHTML = `
        <div class="flex items-center justify-center w-full h-32 bg-surface1">
          <div class="text-center">
            <svg class="mx-auto h-12 w-12 text-tertiary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p class="text-sm text-tertiary mt-1 truncate px-2">${file.name}</p>
          </div>
        </div>
        <button type="button" data-action="media-upload#removeFile" data-file-id="${file.id}" 
                class="absolute top-2 right-2 bg-red text-white rounded-full w-6 h-6 flex items-center justify-center">
          &times;
        </button>
      `
    }

    // Add the file element to the file list
    this.fileListTarget.appendChild(fileElement)
  }

  removeFile(event) {
    const fileId = event.currentTarget.dataset.fileId

    // Remove the file via API
    fetch(`/media_files/${fileId}`, {
      method: 'DELETE',
      headers: {
        'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content,
        'Content-Type': 'application/json'
      }
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          // Remove the element from preview
          const fileElement = this.fileListTarget.querySelector(`[data-file-id="${fileId}"]`)
          if (fileElement) {
            fileElement.remove()
          }

          // Remove from the uploaded files array
          this.uploadedFiles = this.uploadedFiles.filter((file) => file.id !== Number.parseInt(fileId))

          // Dispatch an event to notify other controllers
          this.dispatch('fileRemoved', { detail: { id: fileId } })

          // Update container visibility
          this.updateContainerVisibility()
        } else {
          throw new Error(data.error || 'Failed to delete file')
        }
      })
      .catch((error) => {
        console.error('Error removing file:', error)
        alert(`Error removing file: ${error.message}`)
      })
  }

  updateContainerVisibility() {
    // Show or hide the container based on whether there are any files
    if (this.hasContainerTarget) {
      const hasFiles = this.hasFileListTarget && this.fileListTarget.children.length > 0
      this.containerTarget.classList.toggle('hidden', !hasFiles)
    }
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Get the list of uploaded files (for other controllers)
  getUploadedFiles() {
    return this.uploadedFiles
  }
}

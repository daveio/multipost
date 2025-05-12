require "application_system_test_case"

class VisualRegressionTest < ApplicationSystemTestCase
  setup do
    @user = users(:john)
    
    # Log in with Devise
    visit new_user_session_path
    fill_in "Email", with: @user.email
    fill_in "Password", with: "password123"
    click_on "Log in"
  end

  test "visual regression on dashboard" do
    visit root_path
    assert_selector "h1", text: "Dashboard"
    
    # Take a basic screenshot
    visual_snapshot("Dashboard")
    
    # Compare different themes
    visual_compare_themes("Dashboard")
    
    # Compare different screen sizes
    visual_compare_responsive("Dashboard")
  end
  
  test "visual regression on posts index" do
    visit posts_path
    assert_selector "h1", text: "Posts"
    
    # Take a basic screenshot
    visual_snapshot("Posts Index")
    
    # Compare different themes
    visual_compare_themes("Posts Index")
  end
  
  test "visual regression on post creation form" do
    visit new_post_path
    assert_selector "h1", text: "New Post"
    
    # Take a basic screenshot of the empty form
    visual_snapshot("New Post Form - Empty")
    
    # Fill in the form
    fill_in "Content", with: "This is a test post for visual regression testing"
    check "Bluesky"
    
    # Take a screenshot with form filled in
    visual_snapshot("New Post Form - Filled")
    
    # Compare different themes
    visual_compare_themes("New Post Form")
  end
  
  test "visual regression on post with thread" do
    # Create a thread
    thread_parent = create_thread_for(@user, 3)
    
    # Visit the thread
    visit post_path(thread_parent)
    
    # Take a screenshot of the thread
    visual_snapshot("Post Thread")
    
    # Compare different themes
    visual_compare_themes("Post Thread")
  end
  
  test "visual regression on media upload" do
    visit new_post_path
    
    # Take a screenshot of the empty media upload zone
    visual_snapshot("Media Upload - Empty")
    
    # Attach a file - this is tricky in headless testing, so we'll mock it
    # by adding a CSS class that shows what the UI would look like
    execute_script(<<~JS)
      document.querySelector('.media-upload-zone').classList.add('has-files');
      const previewContainer = document.createElement('div');
      previewContainer.className = 'media-preview-container';
      previewContainer.innerHTML = `
        <div class="media-preview">
          <img src="data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100' height='100' fill='%23ddd'/%3E%3C/svg%3E" alt="Preview">
          <div class="media-info">
            <span class="media-name">test_image.jpg</span>
            <span class="media-size">50 KB</span>
          </div>
          <button class="remove-media-button">Remove</button>
        </div>
      `;
      document.querySelector('.media-upload-zone').appendChild(previewContainer);
    JS
    
    # Take a screenshot with a mock file uploaded
    visual_snapshot("Media Upload - With File")
  end
  
  test "visual regression on login page" do
    # Sign out first
    visit root_path
    click_on "Sign out"
    
    # Visit login page
    visit new_user_session_path
    
    # Take a screenshot
    visual_snapshot("Login Page")
    
    # Compare different themes
    visual_compare_themes("Login Page")
    
    # Compare responsive variations
    visual_compare_responsive("Login Page")
  end
  
  test "visual regression on account settings" do
    visit accounts_path
    assert_selector "h1", text: "Connected Accounts"
    
    # Take a screenshot
    visual_snapshot("Accounts Page")
    
    # Compare different themes
    visual_compare_themes("Accounts Page")
  end
  
  test "visual regression testing modal dialogs" do
    visit posts_path
    
    # Use JavaScript to trigger a modal (assuming a modal in the app)
    execute_script(<<~JS)
      // Create and append a mock modal
      const modal = document.createElement('div');
      modal.className = 'modal';
      modal.style.position = 'fixed';
      modal.style.top = '0';
      modal.style.left = '0';
      modal.style.width = '100%';
      modal.style.height = '100%';
      modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
      modal.style.display = 'flex';
      modal.style.justifyContent = 'center';
      modal.style.alignItems = 'center';
      modal.style.zIndex = '1000';
      
      const modalContent = document.createElement('div');
      modalContent.className = 'modal-content';
      modalContent.style.backgroundColor = 'white';
      modalContent.style.padding = '20px';
      modalContent.style.borderRadius = '8px';
      modalContent.style.maxWidth = '500px';
      modalContent.innerHTML = `
        <h2>Confirmation</h2>
        <p>Are you sure you want to delete this post?</p>
        <div class="modal-actions">
          <button class="btn btn-secondary">Cancel</button>
          <button class="btn btn-danger">Delete</button>
        </div>
      `;
      
      modal.appendChild(modalContent);
      document.body.appendChild(modal);
    JS
    
    # Take a screenshot of the modal
    visual_snapshot("Modal Dialog")
    
    # Compare different themes for the modal
    visual_compare_themes("Modal Dialog")
  end
end
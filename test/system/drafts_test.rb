require "application_system_test_case"

class DraftsTest < ApplicationSystemTestCase
  setup do
    @user = users(:john)
    @draft = drafts(:john_draft)
    
    # Log in with Devise
    visit new_user_session_path
    fill_in "Email", with: @user.email
    fill_in "Password", with: "password123"
    click_on "Log in"
  end

  test "viewing drafts list" do
    visit drafts_path
    
    assert_selector "h1", text: "Drafts"
    
    # Should display user's drafts
    assert_selector ".draft-card", count: @user.drafts.count
    
    # Verify specific draft content appears
    assert_text @draft.content
  end
  
  test "creating a new draft" do
    visit new_draft_path
    
    assert_selector "h1", text: "New Draft"
    
    # Fill in draft content
    fill_in "Content", with: "This is a test draft created by the system test"
    
    # Select a platform
    check "Bluesky"
    
    # Save as draft
    click_on "Save as Draft"
    
    assert_text "Draft was successfully created"
    assert_text "This is a test draft created by the system test"
  end
  
  test "editing a draft" do
    visit edit_draft_path(@draft)
    
    assert_selector "h1", text: "Edit Draft"
    
    # Update draft content
    fill_in "Content", with: "This is an updated draft content"
    
    # Update draft
    click_on "Update Draft"
    
    assert_text "Draft was successfully updated"
    assert_text "This is an updated draft content"
  end
  
  test "deleting a draft" do
    visit drafts_path
    
    within(".draft-card", match: :first) do
      click_on "Delete"
    end
    
    # Accept confirm dialog
    page.driver.browser.switch_to.alert.accept
    
    assert_text "Draft was successfully deleted"
  end
  
  test "publishing a draft" do
    visit draft_path(@draft)
    
    # Click on publish button
    click_on "Publish"
    
    # Should be redirected to the new post with draft content
    assert_text "Post was successfully created"
    assert_text @draft.content
  end
  
  test "adding media to a draft" do
    visit edit_draft_path(@draft)
    
    # Attach a file to the media upload zone
    within(".media-upload-zone") do
      # Using direct attach since drag and drop is hard to test
      attach_file("file", Rails.root.join("test/fixtures/files/test_image.jpg"), make_visible: true)
    end
    
    # Wait for the upload to complete and preview to appear
    assert_selector ".media-preview-container", wait: 5
    
    # Update draft
    click_on "Update Draft"
    
    assert_text "Draft was successfully updated"
    
    # Verify media attachment preview is shown with the draft
    assert_selector ".attached-media"
  end
  
  test "auto-saving draft while typing" do
    visit new_draft_path
    
    # Fill in draft content
    fill_in "Content", with: "This is a draft that will be auto-saved"
    
    # Wait for auto-save to trigger
    assert_text "Draft auto-saved", wait: 10
    
    # Navigate away
    visit drafts_path
    
    # Should see the auto-saved draft
    assert_text "This is a draft that will be auto-saved"
  end
  
  test "converting a draft to a thread" do
    visit edit_draft_path(@draft)
    
    # Enable thread mode
    check "Create thread"
    
    # Add a thread post
    click_on "Add to thread"
    
    within(".thread-posts .thread-post:last-of-type") do
      fill_in "Content", with: "This is a second post in the thread"
    end
    
    # Save draft
    click_on "Update Draft"
    
    assert_text "Draft was successfully updated"
    
    # Publishing should create a thread
    click_on "Publish"
    
    assert_text "Thread was successfully created"
    assert_text "1/2" # Thread position indicator
  end
  
  test "using AI to optimize a draft" do
    visit edit_draft_path(@draft)
    
    # Click optimize button
    click_on "Optimize for platforms"
    
    # Select a platform in the modal
    within("#optimization-modal") do
      select "Bluesky", from: "Platform"
      click_on "Optimize"
    end
    
    # Wait for optimization to complete
    assert_text "Optimization complete", wait: 10
    
    # Check that the content was updated
    assert_selector "textarea#draft_content", text: /.+/
    
    # Save the optimized draft
    click_on "Update Draft"
    
    assert_text "Draft was successfully updated"
  end
end
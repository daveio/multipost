require "application_system_test_case"

class MediaUploadsTest < ApplicationSystemTestCase
  setup do
    @user = users(:john)

    # Log in with Devise
    visit new_user_session_path
    fill_in "Email", with: @user.email
    fill_in "Password", with: "password123"
    click_on "Log in"
  end

  test "uploading media to a new post" do
    visit new_post_path

    fill_in "Content", with: "This is a post with media attachments"

    # Attach a file to the media upload zone
    within(".media-upload-zone") do
      # Using direct attach since drag and drop is hard to test
      attach_file("file", Rails.root.join("test/fixtures/files/test_image.jpg"), make_visible: true)
    end

    # Wait for the upload to complete and preview to appear
    assert_selector ".media-preview-container", wait: 5

    # Select a platform
    check "Bluesky"

    click_on "Create Post"

    assert_text "Post was successfully created"

    # Verify media attachment preview is shown with the post
    assert_selector ".attached-media"
  end

  test "removing media from a post draft" do
    visit new_post_path

    fill_in "Content", with: "This is a post with media attachments that will be removed"

    # Attach a file
    within(".media-upload-zone") do
      attach_file("file", Rails.root.join("test/fixtures/files/test_image.jpg"), make_visible: true)
    end

    # Wait for upload to complete
    assert_selector ".media-preview-container", wait: 5

    # Remove the media file
    within(".media-preview-container") do
      click_on "Remove"
    end

    # Verify media preview is gone
    assert_no_selector ".media-preview-container"

    # Complete the post creation to ensure it works after removal
    check "Bluesky"
    click_on "Create Post"

    assert_text "Post was successfully created"
    assert_no_selector ".attached-media"
  end

  test "uploading multiple media files to a post" do
    visit new_post_path

    fill_in "Content", with: "This is a post with multiple media attachments"

    # Attach first file
    within(".media-upload-zone") do
      attach_file("file", Rails.root.join("test/fixtures/files/test_image.jpg"), make_visible: true)
    end

    # Wait for first upload to complete
    assert_selector ".media-preview-container", wait: 5

    # Attach second file (we'll use the same test file)
    within(".media-upload-zone") do
      attach_file("file", Rails.root.join("test/fixtures/files/test_image.jpg"), make_visible: true)
    end

    # Verify we now have two preview containers
    assert_selector ".media-preview-container", count: 2

    # Complete the post creation
    check "Bluesky"
    click_on "Create Post"

    assert_text "Post was successfully created"
    assert_selector ".attached-media", count: 2
  end

  test "upload validation prevents oversized files" do
    visit new_post_path

    # Create a temporary oversized file
    oversized_file_path = Rails.root.join("tmp/oversized_test_file.jpg")
    File.open(oversized_file_path, "wb") do |f|
      # Create a file larger than the limit (e.g., 11MB if limit is 10MB)
      f.write("0" * 11.megabytes)
    end

    # Try to attach the oversized file
    within(".media-upload-zone") do
      attach_file("file", oversized_file_path, make_visible: true)
    end

    # Verify error message appears
    assert_text "File size exceeds the maximum allowed size"

    # Clean up the temporary file
    File.delete(oversized_file_path) if File.exist?(oversized_file_path)
  end
end

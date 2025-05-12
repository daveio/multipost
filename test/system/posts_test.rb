require "application_system_test_case"

class PostsTest < ApplicationSystemTestCase
  setup do
    @user = users(:john)
    
    # Log in with Devise
    visit new_user_session_path
    fill_in "Email", with: @user.email
    fill_in "Password", with: "password123"
    click_on "Log in"
  end

  test "visiting the posts index" do
    visit posts_path
    assert_selector "h1", text: "Posts"
    assert_selector ".post-card", count: Post.where(user: @user).count
  end

  test "creating a new post" do
    visit new_post_path
    
    fill_in "Content", with: "This is a test post created by the system test"
    
    # Select a platform (using label or data attribute depending on UI)
    check "Bluesky"
    
    click_on "Create Post"
    
    assert_text "Post was successfully created"
    assert_text "This is a test post created by the system test"
  end

  test "creating a thread" do
    visit new_post_path
    
    fill_in "Content", with: "This is the first post in a thread"
    
    # Select a platform
    check "Bluesky"
    
    # Enable thread mode
    check "Create thread"
    
    # Add a thread post
    click_on "Add to thread"
    
    within(".thread-posts .thread-post:last-of-type") do
      fill_in "Content", with: "This is the second post in the thread"
    end
    
    click_on "Create Thread"
    
    assert_text "Thread was successfully created"
    assert_text "This is the first post in a thread"
    assert_text "1/2" # Thread position indicator
  end

  test "editing a post" do
    post = posts(:john_post)
    visit edit_post_path(post)
    
    fill_in "Content", with: "This is an updated post content"
    click_on "Update Post"
    
    assert_text "Post was successfully updated"
    assert_text "This is an updated post content"
  end

  test "deleting a post" do
    visit posts_path
    
    within(".post-card", match: :first) do
      click_on "Delete"
    end
    
    # Accept confirm dialog
    page.driver.browser.switch_to.alert.accept
    
    assert_text "Post was successfully deleted"
  end

  test "viewing a thread" do
    thread_parent = posts(:john_thread_parent)
    visit post_path(thread_parent)
    
    # Check if we're viewing the thread parent
    assert_text thread_parent.content
    
    # Check if thread children are displayed
    assert_text posts(:john_thread_child_1).content
    assert_text posts(:john_thread_child_2).content
    
    # Check thread positions
    assert_text "1/3" # Parent position
    assert_text "2/3" # First child position
    assert_text "3/3" # Second child position
  end
end
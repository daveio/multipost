require "application_system_test_case"

class DashboardTest < ApplicationSystemTestCase
  setup do
    @user = users(:john)

    # Log in with Devise
    visit new_user_session_path
    fill_in "Email", with: @user.email
    fill_in "Password", with: "password123"
    click_on "Log in"
  end

  test "dashboard shows recent posts" do
    visit root_path

    assert_selector "h1", text: "Dashboard"

    # Check for recent posts section
    assert_selector "h2", text: "Recent Posts"

    # User's recent posts should be visible
    assert_selector ".post-card", minimum: 1

    # Verify specific post content appears
    assert_text posts(:john_post).content
  end

  test "dashboard shows account status" do
    visit root_path

    # Check for accounts section
    assert_selector "h2", text: "Connected Accounts"

    # Should show the user's connected accounts
    assert_text "Bluesky"
    assert_text "Mastodon"

    # Should show the account usernames
    assert_text accounts(:john_bluesky).username
    assert_text accounts(:john_mastodon).username
  end

  test "dashboard shows draft count" do
    visit root_path

    # Check for drafts section
    assert_selector "h2", text: "Drafts"

    # Should show the count of drafts
    assert_text "#{@user.drafts.count} drafts"
  end

  test "dashboard has quick links" do
    visit root_path

    # Check for quick links section
    assert_selector "h2", text: "Quick Links"

    # Should have links to important pages
    assert_link "New Post"
    assert_link "My Posts"
    assert_link "Drafts"
    assert_link "Accounts"
  end

  test "create new post from dashboard" do
    visit root_path

    # Click on New Post button/link
    click_on "New Post"

    # Verify we're on the new post page
    assert_current_path new_post_path
    assert_selector "h1", text: "New Post"
  end

  test "view drafts from dashboard" do
    visit root_path

    # Click on Drafts link
    click_on "Drafts"

    # Verify we're on the drafts page
    assert_current_path drafts_path
    assert_selector "h1", text: "Drafts"
  end

  test "theme switcher works" do
    visit root_path

    # Find and click the theme switcher
    click_on "Switch Theme"

    # Select a different theme
    click_on "Mocha" # Assuming Catppuccin Mocha is an option

    # Check that theme class is applied to body or root element
    assert_selector "body.theme-mocha", wait: 2
  end

  test "dashboard shows stats" do
    visit root_path

    # Check for stats section
    assert_selector "h2", text: "Stats"

    # Should show various stats about posts
    assert_text "Published posts: #{@user.posts.published.count}"
    assert_text "Pending posts: #{@user.posts.pending.count}"
  end

  test "dashboard has post activity feed" do
    visit root_path

    # Check for activity feed
    assert_selector "h2", text: "Recent Activity"

    # Should show post activity items
    assert_selector ".activity-item", minimum: 1
  end

  test "access account settings from dashboard" do
    visit root_path

    # Find and click the account settings link
    click_on "Account Settings"

    # Verify we're on the account settings page
    assert_current_path edit_user_registration_path
  end
end

require "application_system_test_case"

class PlatformConfigurationTest < ApplicationSystemTestCase
  setup do
    @user = users(:john)

    # Log in with Devise
    visit new_user_session_path
    fill_in "Email", with: @user.email
    fill_in "Password", with: "password123"
    click_on "Log in"
  end

  test "viewing platform list" do
    visit platforms_path

    assert_selector "h1", text: "Platforms"

    # Check that all platforms are listed
    Platform.all.each do |platform|
      assert_text platform.name.capitalize
      assert_text "Character limit: #{platform.character_limit}"
    end
  end

  test "viewing platform details" do
    platform = platforms(:bluesky)
    visit platform_path(platform)

    assert_selector "h1", text: platform.name.capitalize
    assert_text "Character limit: #{platform.character_limit}"

    # Check for connected accounts section
    assert_text "Connected Accounts"

    # The user has a Bluesky account
    assert_text accounts(:john_bluesky).username
  end

  test "managing account connections" do
    visit accounts_path

    assert_selector "h1", text: "Connected Accounts"

    # User should see their active accounts
    assert_text accounts(:john_bluesky).username
    assert_text accounts(:john_mastodon).username

    # Test deactivating an account
    within("#account_#{accounts(:john_bluesky).id}") do
      click_on "Deactivate"
    end

    assert_text "Account was successfully updated"

    # Go back to accounts page to verify the change
    visit accounts_path

    # Check that the account is now inactive
    within("#account_#{accounts(:john_bluesky).id}") do
      assert_text "Inactive"
      assert_selector "a", text: "Activate" # Now should have Activate button
    end
  end

  test "creating a new splitting configuration" do
    visit new_splitting_configuration_path

    assert_selector "h1", text: "New Splitting Configuration"

    fill_in "Name", with: "My Test Configuration"

    # Select multiple strategies
    check "Semantic splitting"
    check "Hashtag retention"

    click_on "Create Splitting configuration"

    assert_text "Splitting configuration was successfully created"
    assert_text "My Test Configuration"
    assert_text "Semantic splitting"
    assert_text "Hashtag retention"
  end

  test "editing a splitting configuration" do
    config = splitting_configurations(:john_semantic_config)
    visit edit_splitting_configuration_path(config)

    assert_selector "h1", text: "Edit Splitting Configuration"

    fill_in "Name", with: "Updated Configuration Name"

    # Add another strategy
    check "Mention preservation"

    click_on "Update Splitting configuration"

    assert_text "Splitting configuration was successfully updated"
    assert_text "Updated Configuration Name"
    assert_text "Mention preservation" # Should now include this strategy
  end

  test "deleting a splitting configuration" do
    visit splitting_configurations_path

    assert_selector "h1", text: "Splitting Configurations"

    # Should see existing configurations
    assert_text splitting_configurations(:john_semantic_config).name
    assert_text splitting_configurations(:john_complex_config).name

    # Delete the first configuration
    within("#splitting_configuration_#{splitting_configurations(:john_semantic_config).id}") do
      click_on "Delete"
    end

    # Accept confirm dialog
    page.driver.browser.switch_to.alert.accept

    assert_text "Splitting configuration was successfully destroyed"

    # Verify it's gone
    assert_no_text splitting_configurations(:john_semantic_config).name
  end

  test "applying a splitting configuration when creating a post" do
    visit new_post_path

    fill_in "Content", with: "This is a very long post that needs to be split into multiple parts using my custom configuration that I previously created. #hashtags should be retained."

    # Open the splitting configuration dropdown
    click_on "Split post"

    # Select a configuration
    select splitting_configurations(:john_complex_config).name, from: "Configuration"

    # Press the split button
    click_on "Split using Configuration"

    # Wait for the splitting to complete and show multiple parts
    assert_selector ".thread-post", count: 2, wait: 5

    # Check that each part has content
    all(".thread-post").each do |thread_post|
      within(thread_post) do
        assert_selector ".post-content", text: /.+/
      end
    end

    # Verify hashtags were retained in each part (if applicable)
    assert_selector ".post-content", text: "#hashtags"
  end
end

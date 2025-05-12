require "test_helper"

class AccountManagementFlowTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:john)
    sign_in @user
  end

  test "can view and manage accounts" do
    # Step 1: Navigate to accounts index
    get accounts_path
    assert_response :success
    assert_select "h1", "Connected Accounts"

    # Should see existing accounts
    assert_select ".account-item", minimum: 2
    assert_select "td", accounts(:john_bluesky).username
    assert_select "td", accounts(:john_mastodon).username
  end

  test "can create a new platform account" do
    # Step 1: Navigate to new account form
    get new_account_path
    assert_response :success
    assert_select "h1", "New Account"

    # Step 2: Submit new account form
    assert_difference("Account.count") do
      post accounts_path, params: {
        account: {
          platform_id: "threads",
          username: "john_threads",
          display_name: "John Doe",
          access_token: "threads_access_token",
          is_active: true
        }
      }
    end

    # Step 3: Follow redirect to index page
    follow_redirect!
    assert_response :success

    # Should see new account in list
    assert_select "td", "john_threads"
  end

  test "can edit an existing account" do
    account = accounts(:john_bluesky)

    # Step 1: Navigate to edit form
    get edit_account_path(account)
    assert_response :success
    assert_select "h1", "Edit Account"

    # Step 2: Submit changes
    patch account_path(account), params: {
      account: {
        username: "john_updated",
        display_name: "John Updated"
      }
    }

    # Step 3: Follow redirect and verify changes
    follow_redirect!
    assert_response :success

    # Updated information should be visible
    assert_select "td", "john_updated"
  end

  test "can deactivate and reactivate account" do
    account = accounts(:john_bluesky)

    # Step 1: Deactivate account
    patch account_path(account), params: {
      account: {
        is_active: false
      }
    }

    # Step 2: Verify account is inactive
    follow_redirect!
    assert_response :success

    # Reload account and check status
    account.reload
    assert_not account.is_active?

    # Step 3: Reactivate account
    patch account_path(account), params: {
      account: {
        is_active: true
      }
    }

    # Step 4: Verify account is active again
    follow_redirect!
    assert_response :success

    # Reload account and check status
    account.reload
    assert account.is_active?
  end

  test "can delete an account" do
    account = accounts(:john_bluesky)

    # Delete the account
    assert_difference("Account.count", -1) do
      delete account_path(account)
    end

    # Should redirect to index
    follow_redirect!
    assert_response :success

    # Account should no longer be visible
    assert_no_match(/#{account.username}/, @response.body)
  end

  test "displays error messages for invalid accounts" do
    # Try to create account with missing required fields
    post accounts_path, params: {
      account: {
        platform_id: "threads"
        # Missing username and access_token
      }
    }

    # Should not redirect, but render new template with errors
    assert_response :unprocessable_entity
    assert_select ".alert", /Username can't be blank/
    assert_select ".alert", /Access token can't be blank/
  end

  test "filters accounts by platform" do
    # Navigate to accounts index with platform filter
    get accounts_path(platform: "bluesky")
    assert_response :success

    # Should only see accounts for that platform
    assert_select ".account-item" do |elements|
      elements.each do |element|
        assert_match(/bluesky/i, element.text)
      end
    end

    # Should not see accounts for other platforms
    assert_no_match(/mastodon/i, @response.body)
  end
end

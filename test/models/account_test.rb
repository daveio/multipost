require "test_helper"

class AccountTest < ActiveSupport::TestCase
  test "account validity" do
    account = Account.new(
      user: users(:john),
      platform_id: "twitter",
      username: "johndoe_twitter",
      access_token: "twitter_access_token_123",
      is_active: true
    )
    assert account.valid?
  end

  test "account requires user" do
    account = Account.new(
      platform_id: "twitter",
      username: "johndoe_twitter",
      access_token: "twitter_access_token_123"
    )
    assert_not account.valid?
    assert_includes account.errors[:user], "must exist"
  end

  test "account requires platform_id" do
    account = Account.new(
      user: users(:john),
      username: "johndoe_twitter",
      access_token: "twitter_access_token_123"
    )
    assert_not account.valid?
    assert_includes account.errors[:platform_id], "can't be blank"
  end

  test "account requires username" do
    account = Account.new(
      user: users(:john),
      platform_id: "twitter",
      access_token: "twitter_access_token_123"
    )
    assert_not account.valid?
    assert_includes account.errors[:username], "can't be blank"
  end

  test "account requires access_token" do
    account = Account.new(
      user: users(:john),
      platform_id: "twitter",
      username: "johndoe_twitter"
    )
    assert_not account.valid?
    assert_includes account.errors[:access_token], "can't be blank"
  end

  test "account belongs to user" do
    account = accounts(:john_bluesky)
    assert_equal users(:john), account.user
  end

  test "active scope returns only active accounts" do
    active_accounts = Account.active

    # Should include active accounts
    assert_includes active_accounts, accounts(:john_bluesky)
    assert_includes active_accounts, accounts(:john_mastodon)
    assert_includes active_accounts, accounts(:jane_threads)

    # Should not include inactive accounts
    assert_not_includes active_accounts, accounts(:jane_bluesky_inactive)
  end

  test "platform_name returns properly formatted platform name" do
    bluesky_account = accounts(:john_bluesky)
    assert_equal "Bluesky", bluesky_account.platform_name

    mastodon_account = accounts(:john_mastodon)
    assert_equal "Mastodon", mastodon_account.platform_name

    threads_account = accounts(:jane_threads)
    assert_equal "Threads", threads_account.platform_name

    # Test with a non-standard platform
    custom_account = Account.new(platform_id: "custom_platform")
    assert_equal "Custom platform", custom_account.platform_name
  end
end

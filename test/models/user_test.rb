require "test_helper"

class UserTest < ActiveSupport::TestCase
  test "user validity" do
    user = User.new(email: "test@example.com", password: "password123")
    assert user.valid?
  end

  test "user requires email" do
    user = User.new(password: "password123")
    assert_not user.valid?
    assert_includes user.errors[:email], "can't be blank"
  end

  test "user requires password" do
    user = User.new(email: "test@example.com")
    assert_not user.valid?
    assert_includes user.errors[:password], "can't be blank"
  end

  test "user email must be unique" do
    existing_user = users(:john)
    user = User.new(email: existing_user.email, password: "password123")
    assert_not user.valid?
    assert_includes user.errors[:email], "has already been taken"
  end

  test "user has many accounts" do
    user = users(:john)
    assert_equal 2, user.accounts.count
    assert_includes user.accounts, accounts(:john_bluesky)
    assert_includes user.accounts, accounts(:john_mastodon)
  end

  test "user has many posts" do
    user = users(:john)
    assert_equal 4, user.posts.count
  end

  test "user has many drafts" do
    user = users(:john)
    assert_equal 2, user.drafts.count
  end

  test "user has many splitting_configurations" do
    user = users(:john)
    assert_equal 2, user.splitting_configurations.count
  end

  test "platform_accounts returns active accounts for the platform" do
    user = users(:john)
    bluesky_accounts = user.platform_accounts("bluesky")
    assert_equal 1, bluesky_accounts.count
    assert_includes bluesky_accounts, accounts(:john_bluesky)

    user = users(:jane)
    bluesky_accounts = user.platform_accounts("bluesky")
    assert_equal 0, bluesky_accounts.count # Jane has an inactive bluesky account
  end

  test "dependent destruction of associations" do
    user = users(:john)

    # Count associated records before destruction
    account_count = Account.where(user_id: user.id).count
    post_count = Post.where(user_id: user.id).count
    draft_count = Draft.where(user_id: user.id).count
    config_count = SplittingConfiguration.where(user_id: user.id).count

    assert account_count > 0
    assert post_count > 0
    assert draft_count > 0
    assert config_count > 0

    # Destroy the user
    user.destroy

    # Verify that all associated records were destroyed
    assert_equal 0, Account.where(user_id: user.id).count
    assert_equal 0, Post.where(user_id: user.id).count
    assert_equal 0, Draft.where(user_id: user.id).count
    assert_equal 0, SplittingConfiguration.where(user_id: user.id).count
  end
end

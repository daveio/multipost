require "test_helper"

class FactoriesTest < ActiveSupport::TestCase
  test "create_user_with creates a user with valid attributes" do
    user = create_user_with(email: "testfactory@example.com")

    assert user.persisted?
    assert_equal "testfactory@example.com", user.email
    assert user.valid_password?("password123")
  end

  test "create_user_with creates a user with default accounts if requested" do
    user = create_user_with(with_default_accounts: true)

    assert user.persisted?
    assert_equal 2, user.accounts.count

    platforms = user.accounts.map(&:platform_id)
    assert_includes platforms, "bluesky"
    assert_includes platforms, "mastodon"
  end

  test "create_platform_account_for creates an account for a user" do
    user = create_user_with
    account = create_platform_account_for(user, "threads")

    assert account.persisted?
    assert_equal "threads", account.platform_id
    assert_equal user, account.user
    assert account.is_active
  end

  test "create_post_for creates a post for a user" do
    user = create_user_with
    post = create_post_for(user, "Test post content")

    assert post.persisted?
    assert_equal "Test post content", post.content
    assert_equal "published", post.status
    assert_equal user, post.user
  end

  test "create_post_for creates a post with media files if requested" do
    user = create_user_with
    post = create_post_for(user, "Test post with media", media_count: 2)

    assert post.persisted?
    assert_equal 2, post.media_files.count
    assert post.media_files.all? { |mf| mf.name.start_with?("test_image_") }
  end

  test "create_thread_for creates a thread of posts" do
    user = create_user_with
    parent = create_thread_for(user, 4)

    assert parent.persisted?
    assert_equal 3, parent.thread_children.count

    # Check the thread structure
    assert_nil parent.thread_parent_id
    assert_equal 0, parent.thread_index

    parent.thread_children.each_with_index do |child, i|
      assert_equal parent.id, child.thread_parent_id
      assert_equal i + 1, child.thread_index
    end
  end

  test "create_media_file_for creates a media file for an uploadable" do
    user = create_user_with
    post = create_post_for(user, "Test post")
    media = create_media_file_for(post, "factory_test.jpg", user)

    assert media.persisted?
    assert_equal "factory_test.jpg", media.name
    assert_equal "image/jpg", media.file_type
    assert_equal post, media.uploadable
    assert_equal user, media.created_by
  end

  test "create_draft_for creates a draft for a user" do
    user = create_user_with
    draft = create_draft_for(user, "Test draft content")

    assert draft.persisted?
    assert_equal "Test draft content", draft.content
    assert_equal user, draft.user
  end

  test "create_splitting_config_for creates a config for a user" do
    user = create_user_with
    config = create_splitting_config_for(user, "Test Config", [ "semantic", "retain_hashtags" ])

    assert config.persisted?
    assert_equal "Test Config", config.name
    assert_equal user, config.user

    # Check the strategies
    strategies = JSON.parse(config.strategies)
    assert_equal 2, strategies.size
    assert_includes strategies, "semantic"
    assert_includes strategies, "retain_hashtags"
  end
end

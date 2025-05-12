require "test_helper"

class PostTest < ActiveSupport::TestCase
  test "post validity" do
    user = users(:john)
    post = Post.new(
      user: user,
      content: "Test post content",
      status: "pending",
      thread_index: 0,
      platform_selections: [ { id: "bluesky", isSelected: true } ].to_json
    )
    assert post.valid?
  end

  test "post requires content" do
    post = Post.new(user: users(:john))
    assert_not post.valid?
    assert_includes post.errors[:content], "can't be blank"
  end

  test "post requires user" do
    post = Post.new(content: "Test post content")
    assert_not post.valid?
    assert_includes post.errors[:user], "must exist"
  end

  test "post belongs to user" do
    post = posts(:john_post)
    assert_equal users(:john), post.user
  end

  test "post has many media_files" do
    post = posts(:john_post)
    assert_includes post.media_files, media_files(:john_post_image)
  end

  test "post can be a thread parent" do
    thread_parent = posts(:john_thread_parent)
    assert_equal 2, thread_parent.thread_children.count
    assert_includes thread_parent.thread_children, posts(:john_thread_child_1)
    assert_includes thread_parent.thread_children, posts(:john_thread_child_2)
  end

  test "post can be a thread child" do
    thread_child = posts(:john_thread_child_1)
    assert_equal posts(:john_thread_parent), thread_child.thread_parent
  end

  test "thread? returns true for thread parent" do
    thread_parent = posts(:john_thread_parent)
    assert thread_parent.thread?
  end

  test "thread? returns true for thread child" do
    thread_child = posts(:john_thread_child_1)
    assert thread_child.thread?
  end

  test "thread? returns false for standalone post" do
    standalone_post = posts(:john_post)
    assert_not standalone_post.thread?
  end

  test "thread_position returns correct position for thread posts" do
    thread_parent = posts(:john_thread_parent)
    assert_equal "1/3", thread_parent.thread_position

    thread_child_1 = posts(:john_thread_child_1)
    assert_equal "2/3", thread_child_1.thread_position

    thread_child_2 = posts(:john_thread_child_2)
    assert_equal "3/3", thread_child_2.thread_position
  end

  test "thread_position returns nil for standalone post" do
    standalone_post = posts(:john_post)
    assert_nil standalone_post.thread_position
  end

  test "thread_size returns correct count" do
    thread_parent = posts(:john_thread_parent)
    assert_equal 3, thread_parent.thread_size

    thread_child = posts(:john_thread_child_1)
    assert_equal 3, thread_child.thread_size
  end

  test "thread_root returns self for thread parent" do
    thread_parent = posts(:john_thread_parent)
    assert_equal thread_parent, thread_parent.thread_root
  end

  test "thread_root returns parent for thread child" do
    thread_child = posts(:john_thread_child_1)
    assert_equal posts(:john_thread_parent), thread_child.thread_root
  end

  test "scope root_posts returns only posts without a parent" do
    root_posts = Post.root_posts
    assert_includes root_posts, posts(:john_post)
    assert_includes root_posts, posts(:john_thread_parent)
    assert_not_includes root_posts, posts(:john_thread_child_1)
    assert_not_includes root_posts, posts(:john_thread_child_2)
  end

  test "scope published returns only published posts" do
    published_posts = Post.published
    assert_includes published_posts, posts(:john_post)
    assert_not_includes published_posts, posts(:jane_pending_post)
    assert_not_includes published_posts, posts(:jane_failed_post)
  end

  test "scope pending returns only pending posts" do
    pending_posts = Post.pending
    assert_includes pending_posts, posts(:jane_pending_post)
    assert_not_includes pending_posts, posts(:john_post)
    assert_not_includes pending_posts, posts(:jane_failed_post)
  end

  test "scope failed returns only failed posts" do
    failed_posts = Post.failed
    assert_includes failed_posts, posts(:jane_failed_post)
    assert_not_includes failed_posts, posts(:john_post)
    assert_not_includes failed_posts, posts(:jane_pending_post)
  end

  test "selected_platforms returns array of selected platform ids" do
    post = posts(:john_post)
    assert_equal [ "bluesky", "mastodon" ], post.selected_platforms
  end

  test "selected_platforms returns empty array when platform_selections is empty" do
    post = Post.new(user: users(:john), content: "Test content")
    assert_empty post.selected_platforms
  end

  test "post media_files are destroyed when post is destroyed" do
    post = posts(:john_post)
    media_file_id = media_files(:john_post_image).id

    assert MediaFile.exists?(media_file_id)
    post.destroy
    assert_not MediaFile.exists?(media_file_id)
  end

  test "thread children are nullified when thread parent is destroyed" do
    thread_parent = posts(:john_thread_parent)
    thread_child_id = posts(:john_thread_child_1).id

    thread_parent.destroy

    # Child should still exist but its thread_parent_id should be nil
    thread_child = Post.find(thread_child_id)
    assert_nil thread_child.thread_parent_id
  end
end

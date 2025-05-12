require "test_helper"

# This is an example of how to organize tests using contexts and shared examples
class OrganizedPostTest < ActiveSupport::TestCase
  # Define shared examples for validations
  shared_examples_for "a validated model" do |model_class|
    test "requires content" do
      model = model_class.new(user: users(:john))
      assert_not model.valid?
      assert_includes model.errors[:content], "can't be blank"
    end

    test "requires user" do
      model = model_class.new(content: "Test content")
      assert_not model.valid?
      assert_includes model.errors[:user], "must exist"
    end
  end

  # Define shared examples for media handling
  shared_examples_for "supports media attachments" do |model_class|
    test "can have multiple media files" do
      model = create_factory_model(model_class)

      # Add media files
      3.times do |i|
        create_media_file_for(model, "test_#{i}.jpg", users(:john))
      end

      assert_equal 3, model.media_files.count
    end

    test "destroys media files when destroyed" do
      model = create_factory_model(model_class)
      media = create_media_file_for(model, "to_be_deleted.jpg", users(:john))

      media_id = media.id
      assert MediaFile.exists?(media_id)

      model.destroy
      assert_not MediaFile.exists?(media_id)
    end
  end

  # Root context tests
  test "post validity" do
    post = Post.new(
      user: users(:john),
      content: "Test post content",
      status: "published"
    )
    assert post.valid?
  end

  # Include shared examples
  include_examples "a validated model", Post
  include_examples "supports media attachments", Post

  # Define a context for published posts
  context "when published" do
    setup do
      @post = posts(:john_post)
      @post.status = "published"
      @post.save!
    end

    test "is included in published scope" do
      assert_includes Post.published, @post
    end

    test "is not included in pending scope" do
      assert_not_includes Post.pending, @post
    end

    test "is not included in failed scope" do
      assert_not_includes Post.failed, @post
    end
  end

  # Define a context for pending posts
  context "when pending" do
    setup do
      @post = posts(:jane_pending_post)
    end

    test "is included in pending scope" do
      assert_includes Post.pending, @post
    end

    test "is not included in published scope" do
      assert_not_includes Post.published, @post
    end

    test "is not included in failed scope" do
      assert_not_includes Post.failed, @post
    end
  end

  # Define a context for thread-related functionality
  context "with thread functionality" do
    setup do
      @thread_parent = posts(:john_thread_parent)
      @thread_child_1 = posts(:john_thread_child_1)
      @thread_child_2 = posts(:john_thread_child_2)
    end

    test "thread? returns true for parent" do
      assert @thread_parent.thread?
    end

    test "thread? returns true for children" do
      assert @thread_child_1.thread?
      assert @thread_child_2.thread?
    end

    test "thread_root returns self for parent" do
      assert_equal @thread_parent, @thread_parent.thread_root
    end

    test "thread_root returns parent for children" do
      assert_equal @thread_parent, @thread_child_1.thread_root
      assert_equal @thread_parent, @thread_child_2.thread_root
    end

    test "thread_size returns correct count" do
      assert_equal 3, @thread_parent.thread_size
      assert_equal 3, @thread_child_1.thread_size
    end

    # Nested context for thread position
    context "with thread positions" do
      test "thread_position returns correct position for parent" do
        assert_equal "1/3", @thread_parent.thread_position
      end

      test "thread_position returns correct position for children" do
        assert_equal "2/3", @thread_child_1.thread_position
        assert_equal "3/3", @thread_child_2.thread_position
      end
    end
  end

  # Define a context for platform selections
  context "with platform selections" do
    setup do
      @post = posts(:john_post)
      @post.platform_selections = [
        { id: "bluesky", isSelected: true },
        { id: "mastodon", isSelected: true },
        { id: "threads", isSelected: false }
      ].to_json
      @post.save!
    end

    test "selected_platforms returns array of selected platform ids" do
      assert_equal [ "bluesky", "mastodon" ], @post.selected_platforms
    end

    test "selected_platforms does not include unselected platforms" do
      assert_not_includes @post.selected_platforms, "threads"
    end

    test "selected_platforms returns empty array when platform_selections is empty" do
      @post.platform_selections = [].to_json
      @post.save!
      assert_empty @post.selected_platforms
    end
  end

  private

  # Helper to create a model instance for testing
  def create_factory_model(model_class)
    case model_class.name
    when "Post"
      create_post_for(users(:john), "Test post for #{model_class.name}")
    when "Draft"
      create_draft_for(users(:john), "Test draft for #{model_class.name}")
    else
      raise "Unsupported model class: #{model_class.name}"
    end
  end
end

module PostTestHelpers
  # Create a post with the given attributes
  # @param attributes [Hash] attributes for the post
  # @param user [User] the user who creates the post, defaults to users(:john)
  # @return [Post] the created post
  def create_post(attributes = {}, user = users(:john))
    default_attributes = {
      content: "Test post content #{Time.now.to_i}",
      status: "published",
      platform_selections: [ { id: "bluesky", isSelected: true } ].to_json
    }

    user.posts.create!(default_attributes.merge(attributes))
  end

  # Create a thread with the given number of posts
  # @param post_count [Integer] number of posts in the thread
  # @param user [User] the user who creates the thread, defaults to users(:john)
  # @return [Post] the thread parent post
  def create_thread(post_count = 3, user = users(:john))
    # Create thread parent
    parent = create_post({ content: "Thread parent post" }, user)

    # Create thread children
    (post_count - 1).times do |i|
      create_post({
        content: "Thread child post #{i + 1}",
        thread_parent: parent,
        thread_index: i + 1
      }, user)
    end

    parent
  end

  # Attach a media file to a post or draft
  # @param uploadable [Post, Draft] the post or draft to attach media to
  # @param file_type [String] the media file type (defaults to 'image/jpeg')
  # @param user [User] the user who creates the media, defaults to users(:john)
  # @return [MediaFile] the created media file
  def attach_media(uploadable, file_type = "image/jpeg", user = users(:john))
    file_name = file_type.include?("image") ? "test_image.jpg" :
                file_type.include?("video") ? "test_video.mp4" : "test_file.txt"

    media_file = uploadable.media_files.create!(
      name: file_name,
      file_type: file_type,
      size: 10240,
      url: "/uploads/#{file_name}",
      preview_url: "/uploads/thumbnails/#{file_name}",
      created_by: user
    )

    media_file
  end

  # Assert that the post has the expected attributes
  # @param post [Post] the post to check
  # @param expected_attributes [Hash] the expected attributes
  def assert_post_attributes(post, expected_attributes)
    expected_attributes.each do |attr, value|
      assert_equal value, post.send(attr), "Expected post.#{attr} to be #{value.inspect}, but was #{post.send(attr).inspect}"
    end
  end

  # Assert that the post's platform selections include the specified platform
  # @param post [Post] the post to check
  # @param platform_id [String] the platform ID to check for
  def assert_post_includes_platform(post, platform_id)
    assert post.selected_platforms.include?(platform_id),
      "Expected post to include platform #{platform_id}, but it didn't. Selected platforms: #{post.selected_platforms.inspect}"
  end

  # Assert that a post is part of a thread with the expected length
  # @param post [Post] the post to check
  # @param expected_thread_size [Integer] the expected thread size
  def assert_thread_size(post, expected_thread_size)
    if post.thread_parent_id.present?
      thread_parent = post.thread_parent
    else
      thread_parent = post
    end

    assert_equal expected_thread_size, thread_parent.thread_size,
      "Expected thread to have #{expected_thread_size} posts, but it had #{thread_parent.thread_size}"
  end
end

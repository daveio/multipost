module Factories
  # Factory methods for creating test data programmatically

  # Create a user with the given attributes
  # @param attributes [Hash] attributes to override defaults
  # @return [User] the created user
  def create_user_with(attributes = {})
    email = attributes[:email] || "user_#{Time.now.to_i}@example.com"
    password = attributes[:password] || "password123"

    user = User.create!(
      email: email,
      password: password,
      password_confirmation: password
    )

    # Create default accounts if requested
    if attributes[:with_default_accounts]
      create_platform_account_for(user, "bluesky")
      create_platform_account_for(user, "mastodon")
    end

    # Create default configs if requested
    if attributes[:with_default_configs]
      create_splitting_config_for(user, "Default Config", [ "semantic" ])
    end

    user
  end

  # Create a platform account for a user
  # @param user [User] the user to create the account for
  # @param platform_name [String] the platform name
  # @param attributes [Hash] attributes to override defaults
  # @return [Account] the created account
  def create_platform_account_for(user, platform_name, attributes = {})
    platform = Platform.find_by(name: platform_name) ||
               Platform.create!(name: platform_name, character_limit: default_character_limit_for(platform_name))

    username = attributes[:username] || "#{user.email.split('@').first}_#{platform_name}"

    instance_url = case platform_name
    when "mastodon" then attributes[:instance_url] || "https://mastodon.social"
    when "bluesky" then attributes[:instance_url] || "https://bsky.app"
    else nil
    end

    user.accounts.create!(
      platform_id: platform_name,
      username: username,
      display_name: attributes[:display_name] || username.humanize,
      access_token: attributes[:access_token] || "#{platform_name}_token_#{SecureRandom.hex(8)}",
      refresh_token: attributes[:refresh_token],
      instance_url: instance_url,
      is_active: attributes.key?(:is_active) ? attributes[:is_active] : true
    )
  end

  # Create a post for a user
  # @param user [User] the user to create the post for
  # @param content [String] the post content
  # @param attributes [Hash] attributes to override defaults
  # @return [Post] the created post
  def create_post_for(user, content, attributes = {})
    platform_selections = attributes[:platform_selections] ||
                         [ { id: "bluesky", isSelected: true } ].to_json

    post = user.posts.create!(
      content: content,
      status: attributes[:status] || "published",
      thread_parent_id: attributes[:thread_parent_id],
      thread_index: attributes[:thread_index] || 0,
      platform_selections: platform_selections
    )

    # Attach media if provided
    if attributes[:media_files].present?
      attributes[:media_files].each do |media_file|
        post.media_files << media_file
      end
    end

    # Create media files if count specified
    if attributes[:media_count].present? && attributes[:media_count] > 0
      attributes[:media_count].times do |i|
        create_media_file_for(post, "test_image_#{i}.jpg", user)
      end
    end

    post
  end

  # Create a thread of posts for a user
  # @param user [User] the user to create the thread for
  # @param post_count [Integer] number of posts in the thread
  # @param attributes [Hash] attributes for all posts in the thread
  # @return [Post] the thread parent post
  def create_thread_for(user, post_count = 3, attributes = {})
    # Create parent post
    parent = create_post_for(
      user,
      attributes[:parent_content] || "Thread parent post",
      attributes.except(:parent_content, :child_content_prefix)
    )

    # Create child posts
    (post_count - 1).times do |i|
      content = if attributes[:child_content_prefix]
                 "#{attributes[:child_content_prefix]} #{i + 1}"
      else
                 "Thread child post #{i + 1}"
      end

      create_post_for(
        user,
        content,
        attributes.merge(
          thread_parent_id: parent.id,
          thread_index: i + 1
        )
      )
    end

    parent
  end

  # Create a media file for an uploadable (post or draft)
  # @param uploadable [Post, Draft] the uploadable to attach the media to
  # @param filename [String] the filename
  # @param user [User] the user who created the file
  # @param attributes [Hash] attributes to override defaults
  # @return [MediaFile] the created media file
  def create_media_file_for(uploadable, filename = "test_image.jpg", user = nil, attributes = {})
    file_type = if filename.end_with?(".jpg", ".jpeg", ".png", ".gif")
                 "image/#{filename.split('.').last}"
    elsif filename.end_with?(".mp4", ".mov")
                 "video/#{filename.split('.').last}"
    elsif filename.end_with?(".mp3", ".wav")
                 "audio/#{filename.split('.').last}"
    else
                 "application/octet-stream"
    end

    uploadable.media_files.create!(
      name: filename,
      file_type: attributes[:file_type] || file_type,
      size: attributes[:size] || 10240,
      url: attributes[:url] || "/uploads/#{filename}",
      preview_url: attributes[:preview_url] || "/uploads/thumbnails/#{filename}",
      created_by: user
    )
  end

  # Create a draft for a user
  # @param user [User] the user to create the draft for
  # @param content [String] the draft content
  # @param attributes [Hash] attributes to override defaults
  # @return [Draft] the created draft
  def create_draft_for(user, content, attributes = {})
    platform_selections = attributes[:platform_selections] ||
                         [ { id: "bluesky", isSelected: true } ].to_json

    draft = user.drafts.create!(
      content: content,
      platform_selections: platform_selections
    )

    # Attach media if provided
    if attributes[:media_files].present?
      attributes[:media_files].each do |media_file|
        draft.media_files << media_file
      end
    end

    # Create media files if count specified
    if attributes[:media_count].present? && attributes[:media_count] > 0
      attributes[:media_count].times do |i|
        create_media_file_for(draft, "draft_image_#{i}.jpg", user)
      end
    end

    draft
  end

  # Create a splitting configuration for a user
  # @param user [User] the user to create the config for
  # @param name [String] the config name
  # @param strategies [Array] the strategies to use
  # @param attributes [Hash] attributes to override defaults
  # @return [SplittingConfiguration] the created config
  def create_splitting_config_for(user, name, strategies = [ "semantic" ], attributes = {})
    user.splitting_configurations.create!(
      name: name,
      strategies: strategies.to_json
    )
  end

  private

  # Default character limit for a platform
  # @param platform_name [String] the platform name
  # @return [Integer] the default character limit
  def default_character_limit_for(platform_name)
    case platform_name
    when "bluesky" then 300
    when "mastodon" then 500
    when "threads" then 500
    else 280 # Default
    end
  end
end

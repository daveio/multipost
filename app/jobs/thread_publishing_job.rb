class ThreadPublishingJob < ApplicationJob
  queue_as :default
  
  # Retry options
  retry_on StandardError, wait: :exponentially_longer, attempts: 5
  discard_on ActiveRecord::RecordNotFound
  
  # Job to publish a thread to a specific platform
  # @param parent_post_id [Integer] The ID of the thread parent post
  # @param account_id [Integer] The ID of the account to publish to
  def perform(parent_post_id, account_id)
    parent_post = Post.find(parent_post_id)
    account = Account.find(account_id)
    
    Rails.logger.info "Publishing thread from post #{parent_post_id} to #{account.platform_id} (#{account.username})"
    
    # Check if this is actually a thread
    unless parent_post.thread?
      Rails.logger.error "Post #{parent_post_id} is not a thread"
      return
    end
    
    # Get the thread posts in order (parent first, then children by thread_index)
    thread_posts = [parent_post] + parent_post.thread_children.order(:thread_index).to_a
    
    # Get the appropriate service for the platform
    service = platform_service_for(account)
    
    # Initialize variables for tracking thread
    parent_external_id = nil
    thread_status = 'published'
    
    # Publish each post in the thread
    thread_posts.each_with_index do |post, index|
      # Update post status to processing for this platform
      update_post_status(post, account.platform_id, 'processing')
      
      # Process media files if needed
      media_files = process_media_for_platform(post, account.platform_id)
      
      begin
        # Publish to the platform (replies reference the parent post)
        response = if index == 0
                    # First post in thread
                    service.create_post(post.content, media_files)
                  else
                    # Reply to parent
                    service.create_post(post.content, media_files, parent_external_id)
                  end
        
        if response[:success]
          # Save the external ID for the parent post
          parent_external_id = response[:post_id] if index == 0
          
          # Record successful publish
          update_post_status(post, account.platform_id, 'published', response)
          Rails.logger.info "Successfully published thread post #{post.id} to #{account.platform_id}"
        else
          # Record failure
          update_post_status(post, account.platform_id, 'failed', response)
          Rails.logger.error "Failed to publish thread post #{post.id} to #{account.platform_id}: #{response[:error]}"
          thread_status = 'failed'
          break # Stop publishing the thread if one post fails
        end
      rescue => e
        update_post_status(post, account.platform_id, 'failed', { error: e.message })
        Rails.logger.error "Exception when publishing thread post #{post.id} to #{account.platform_id}: #{e.message}"
        thread_status = 'failed'
        raise e # Re-raise the exception to trigger retry
      end
    end
    
    # Update the thread parent with overall status
    parent_post.update(status: thread_status)
  end
  
  private
  
  # Get the appropriate service for the platform
  # @param account [Account] The account to publish to
  # @return [Object] The platform service
  def platform_service_for(account)
    case account.platform_id
    when 'bluesky'
      Platforms::BlueskyService.new(account.access_token, account.instance_url)
    when 'mastodon'
      Platforms::MastodonService.new(account.access_token, account.instance_url)
    when 'threads'
      Platforms::ThreadsService.new(account.access_token)
    when 'nostr'
      Platforms::NostrService.new(account.access_token)
    else
      raise "Unsupported platform: #{account.platform_id}"
    end
  end
  
  # Process media files for the platform
  # @param post [Post] The post with media files
  # @param platform_id [String] The platform ID
  # @return [Array<MediaFile>] The processed media files
  def process_media_for_platform(post, platform_id)
    # Get media files for this post
    media_files = post.media_files

    # If no media files, return empty array
    return [] if media_files.empty?

    # Process each media file for the specific platform
    processed_files = media_files.map do |media_file|
      MediaService.process_for_platform(media_file, platform_id)
    end

    processed_files
  end
  
  # Update post status for a specific platform
  # @param post [Post] The post to update
  # @param platform_id [String] The platform ID
  # @param status [String] The new status
  # @param response [Hash] The response from the platform API
  def update_post_status(post, platform_id, status, response = nil)
    # Find the platform selection in the post's platform_selections
    platform_selections = JSON.parse(post.platform_selections)
    
    platform_selections.each do |selection|
      if selection['id'] == platform_id
        selection['status'] = status
        
        # Store external post ID and URL if available
        if response && response[:post_id].present?
          selection['external_id'] = response[:post_id]
        end
        
        if response && response[:url].present?
          selection['url'] = response[:url]
        end
      end
    end
    
    # Update the post
    post.update(platform_selections: platform_selections.to_json)
  end
end
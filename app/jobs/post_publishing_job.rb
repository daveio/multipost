class PostPublishingJob < ApplicationJob
  queue_as :default
  
  # Retry options
  retry_on StandardError, wait: :exponentially_longer, attempts: 5
  discard_on ActiveRecord::RecordNotFound
  
  # Job to publish a post to a specific platform
  # @param post_id [Integer] The ID of the post to publish
  # @param account_id [Integer] The ID of the account to publish to
  def perform(post_id, account_id)
    post = Post.find(post_id)
    account = Account.find(account_id)
    
    Rails.logger.info "Publishing post #{post_id} to #{account.platform_id} (#{account.username})"
    
    # Get the appropriate service for the platform
    service = platform_service_for(account)
    
    # Update post status to processing for this platform
    update_post_status(post, account.platform_id, 'processing')
    
    # Process media files if needed
    media_files = process_media_for_platform(post, account.platform_id)
    
    # Publish to the platform
    response = service.create_post(post.content, media_files)
    
    if response[:success]
      # Record successful publish
      update_post_status(post, account.platform_id, 'published', response)
      Rails.logger.info "Successfully published post #{post_id} to #{account.platform_id}"
    else
      # Record failure
      update_post_status(post, account.platform_id, 'failed', response)
      Rails.logger.error "Failed to publish post #{post_id} to #{account.platform_id}: #{response[:error]}"
      
      # Raise an error to trigger retry
      raise "Failed to publish to #{account.platform_id}: #{response[:error]}"
    end
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
    
    # If all platforms are published, mark the post as published
    # If any platform is failed, mark the post as failed
    # Otherwise, keep the post as pending
    all_statuses = platform_selections.map { |s| s['status'] if s['isSelected'] }.compact
    
    if all_statuses.all? { |s| s == 'published' }
      post.update(status: 'published')
    elsif all_statuses.any? { |s| s == 'failed' }
      post.update(status: 'failed')
    else
      post.update(status: 'pending')
    end
  end
end
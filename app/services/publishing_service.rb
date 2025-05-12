class PublishingService
  # Publish a post to all selected platforms
  # @param post [Post] The post to publish
  # @return [Boolean] Whether the publish was initiated successfully
  def self.publish_post(post)
    # Ensure the post exists
    return false unless post.present?
    
    # Get selected platform IDs
    selected_platforms = post.selected_platforms
    return false if selected_platforms.empty?
    
    # Check if this is a thread
    is_thread = post.thread?
    
    # For each selected platform, get the user's active accounts
    selected_platforms.each do |platform_id|
      accounts = post.user.platform_accounts(platform_id)
      
      # Skip if no active accounts for this platform
      next if accounts.empty?
      
      # For each account, enqueue a job to publish the post
      accounts.each do |account|
        if is_thread && post.thread_parent_id.nil? # Only publish threads from the parent
          ThreadPublishingJob.perform_later(post.id, account.id)
        else
          PostPublishingJob.perform_later(post.id, account.id)
        end
      end
    end
    
    # Update post status to pending
    post.update(status: 'pending')
    
    true
  end
  
  # Publish a post at a specified time
  # @param post [Post] The post to publish
  # @param publish_at [DateTime] When to publish the post
  # @param options [Hash] Additional options for scheduling
  # @option options [Boolean] :staggered Whether to stagger the publishing across platforms
  # @option options [Integer] :stagger_interval Seconds between platform publishing (default: 30)
  # @return [Boolean] Whether the scheduled publish was initiated successfully
  def self.schedule_post(post, publish_at, options = {})
    # Ensure the post exists and publish_at is in the future
    return false unless post.present? && publish_at.present? && publish_at > Time.current

    # Get selected platform IDs
    selected_platforms = post.selected_platforms
    return false if selected_platforms.empty?

    # Check if this is a thread
    is_thread = post.thread?

    # Check for staggered publishing
    staggered = options[:staggered] || false
    stagger_interval = options[:stagger_interval] || 30 # Default 30 seconds between platforms

    # For each selected platform, get the user's active accounts
    selected_platforms.each_with_index do |platform_id, index|
      accounts = post.user.platform_accounts(platform_id)

      # Skip if no active accounts for this platform
      next if accounts.empty?

      # Calculate the publish time for this platform (if staggered)
      platform_publish_at = staggered ? publish_at + (index * stagger_interval).seconds : publish_at

      # For each account, enqueue a job to publish the post at the specified time
      accounts.each do |account|
        if is_thread && post.thread_parent_id.nil? # Only publish threads from the parent
          ThreadPublishingJob.set(wait_until: platform_publish_at).perform_later(post.id, account.id)
        else
          PostPublishingJob.set(wait_until: platform_publish_at).perform_later(post.id, account.id)
        end
      end
    end

    # Update post status to scheduled
    post.update(status: 'scheduled', scheduled_at: publish_at)

    true
  end
  
  # Retry publishing a failed post
  # @param post [Post] The post to retry
  # @return [Boolean] Whether the retry was initiated successfully
  def self.retry_post(post)
    # Ensure the post exists and is in a failed state
    return false unless post.present? && post.status == 'failed'
    
    # Get platform selections with failed status
    platform_selections = JSON.parse(post.platform_selections)
    failed_platforms = platform_selections.select { |s| s['isSelected'] && s['status'] == 'failed' }.map { |s| s['id'] }
    
    # Check if this is a thread
    is_thread = post.thread?
    
    # For each failed platform, get the user's active accounts
    failed_platforms.each do |platform_id|
      accounts = post.user.platform_accounts(platform_id)
      
      # Skip if no active accounts for this platform
      next if accounts.empty?
      
      # For each account, enqueue a job to publish the post
      accounts.each do |account|
        if is_thread && post.thread_parent_id.nil? # Only publish threads from the parent
          ThreadPublishingJob.perform_later(post.id, account.id)
        else
          PostPublishingJob.perform_later(post.id, account.id)
        end
      end
    end
    
    # Update post status to pending
    post.update(status: 'pending')
    
    true
  end
end
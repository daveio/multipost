module PlatformApiMockHelpers
  # Mock implementation of BlueskyService for testing
  class MockBlueskyService
    attr_reader :access_token, :instance_url
    
    def initialize(access_token, instance_url = 'https://bsky.app')
      @access_token = access_token
      @instance_url = instance_url
      @posts = []
    end
    
    def create_post(content, media_files = [])
      begin
        validate_content!(content)
        
        post_id = "at://did:plc:#{SecureRandom.hex(8)}/app.bsky.feed.post/#{SecureRandom.hex(8)}"
        cid = SecureRandom.hex(16)
        
        new_post = {
          id: post_id,
          cid: cid,
          text: content,
          created_at: Time.now.iso8601,
          has_media: media_files.any?,
          media_count: media_files.size
        }
        
        @posts << new_post
        
        {
          success: true,
          post_id: post_id,
          url: "#{@instance_url}/profile/#{post_id.split('/')[2]}/post/#{cid}"
        }
      rescue ArgumentError => e
        {
          success: false,
          error: e.message
        }
      rescue StandardError => e
        {
          success: false,
          error: "Unexpected error: #{e.message}"
        }
      end
    end
    
    def get_profile(username)
      # For testing, we'll return a mock profile for any username
      {
        success: true,
        username: username,
        display_name: "#{username.capitalize} Display Name",
        avatar_url: "https://example.com/avatars/#{username}.jpg",
        follower_count: rand(1..1000),
        following_count: rand(1..500)
      }
    end
    
    # For testing, expose posts that were created
    def get_posts
      @posts
    end
    
    private
    
    def validate_content!(content)
      raise ArgumentError, "Content can't be blank" if content.blank?
      
      if content.include?("TRIGGER_ERROR")
        raise ArgumentError, "Simulated API error"
      end
      
      platform = Platform.find_by(name: 'bluesky')
      if platform && content.length > platform.character_limit
        raise ArgumentError, "Content exceeds the maximum length of #{platform.character_limit} characters"
      end
    end
  end
  
  # Mock implementation of MastodonService for testing
  class MockMastodonService
    attr_reader :access_token, :instance_url
    
    def initialize(access_token, instance_url)
      @access_token = access_token
      @instance_url = instance_url
      @posts = []
      @media_id_counter = 1
    end
    
    def create_post(content, media_files = [], visibility = 'public')
      begin
        validate_content!(content)
        
        media_ids = []
        if media_files.any?
          media_files.each do |file|
            media_response = upload_media(file)
            if media_response[:success]
              media_ids << media_response[:media_id]
            else
              return media_response
            end
          end
        end
        
        post_id = rand(10000000..99999999).to_s
        
        new_post = {
          id: post_id,
          content: content,
          visibility: visibility,
          media_ids: media_ids,
          created_at: Time.now.iso8601
        }
        
        @posts << new_post
        
        {
          success: true,
          post_id: post_id,
          url: "#{@instance_url}/@#{verify_credentials[:username]}/#{post_id}"
        }
      rescue ArgumentError => e
        {
          success: false,
          error: e.message
        }
      rescue StandardError => e
        {
          success: false,
          error: "Unexpected error: #{e.message}"
        }
      end
    end
    
    def verify_credentials
      # Return mock credentials
      {
        success: true,
        username: "test_user",
        display_name: "Test User",
        avatar_url: "#{@instance_url}/avatars/test_user.jpg",
        follower_count: 250,
        following_count: 150
      }
    end
    
    # For testing, expose posts that were created
    def get_posts
      @posts
    end
    
    private
    
    def upload_media(file)
      if file.name.include?("TRIGGER_ERROR")
        return { success: false, error: "Simulated media upload error" }
      end
      
      media_id = @media_id_counter
      @media_id_counter += 1
      
      { success: true, media_id: media_id.to_s }
    end
    
    def validate_content!(content)
      raise ArgumentError, "Content can't be blank" if content.blank?
      
      if content.include?("TRIGGER_ERROR")
        raise ArgumentError, "Simulated API error"
      end
      
      platform = Platform.find_by(name: 'mastodon')
      if platform && content.length > platform.character_limit
        raise ArgumentError, "Content exceeds the maximum length of #{platform.character_limit} characters"
      end
    end
  end
  
  # Mock implementation of ThreadsService for testing
  class MockThreadsService
    attr_reader :access_token
    
    def initialize(access_token)
      @access_token = access_token
      @posts = []
    end
    
    def create_post(content, media_files = [], reply_to = nil)
      begin
        validate_content!(content)
        
        post_id = rand(10000000..99999999).to_s
        
        new_post = {
          id: post_id,
          text: content,
          created_at: Time.now.iso8601,
          has_media: media_files.any?,
          media_count: media_files.size,
          reply_to_id: reply_to
        }
        
        @posts << new_post
        
        {
          success: true,
          post_id: post_id,
          url: "https://threads.net/test_user/post/#{post_id}"
        }
      rescue ArgumentError => e
        {
          success: false,
          error: e.message
        }
      rescue StandardError => e
        {
          success: false,
          error: "Unexpected error: #{e.message}"
        }
      end
    end
    
    def get_profile(username)
      # Return mock profile
      {
        success: true,
        username: username,
        display_name: "#{username.capitalize} User",
        avatar_url: "https://threads.net/avatars/#{username}.jpg",
        follower_count: rand(1..10000),
        following_count: rand(1..1000),
        bio: "This is a test bio for #{username}"
      }
    end
    
    # For testing, expose posts that were created
    def get_posts
      @posts
    end
    
    private
    
    def validate_content!(content)
      raise ArgumentError, "Content can't be blank" if content.blank?
      
      if content.include?("TRIGGER_ERROR")
        raise ArgumentError, "Simulated API error"
      end
      
      platform = Platform.find_by(name: 'threads')
      if platform && content.length > platform.character_limit
        raise ArgumentError, "Content exceeds the maximum length of #{platform.character_limit} characters"
      end
    end
  end
  
  # Helper method to replace platform services with mocks
  def mock_platform_apis
    # Store original classes
    original_bluesky = Platforms::BlueskyService
    original_mastodon = Platforms::MastodonService
    original_threads = Platforms::ThreadsService
    
    # Replace with mocks
    silence_warnings do
      Platforms.const_set(:BlueskyService, MockBlueskyService)
      Platforms.const_set(:MastodonService, MockMastodonService)
      Platforms.const_set(:ThreadsService, MockThreadsService)
    end
    
    # Yield to the block
    yield
    
    # Restore original classes
    silence_warnings do
      Platforms.const_set(:BlueskyService, original_bluesky)
      Platforms.const_set(:MastodonService, original_mastodon)
      Platforms.const_set(:ThreadsService, original_threads)
    end
  end
  
  # Helper to create a mock platform service instance
  def mock_platform_service(platform_name, account = nil)
    case platform_name
    when 'bluesky'
      account ||= accounts(:john_bluesky)
      MockBlueskyService.new(account.access_token, account.instance_url)
    when 'mastodon'
      account ||= accounts(:john_mastodon)
      MockMastodonService.new(account.access_token, account.instance_url)
    when 'threads'
      account ||= accounts(:jane_threads)
      MockThreadsService.new(account.access_token)
    else
      raise ArgumentError, "Unsupported platform: #{platform_name}"
    end
  end
  
  private
  
  def silence_warnings
    original_verbose = $VERBOSE
    $VERBOSE = nil
    yield
  ensure
    $VERBOSE = original_verbose
  end
end
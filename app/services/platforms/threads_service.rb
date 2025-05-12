module Platforms
  class ThreadsService
    attr_reader :access_token
    
    def initialize(access_token)
      @access_token = access_token
    end
    
    # Post a status to Threads
    # @param content [String] the text content to post
    # @param media_files [Array<MediaFile>] optional media files to attach
    # @param reply_to [String] optional post ID to reply to
    # @return [Hash] response with success status and details
    def create_post(content, media_files = [], reply_to = nil)
      validate_content!(content)
      
      # Prepare the post data
      post_data = {
        text: content,
        created_at: Time.now.iso8601
      }
      
      # Add media if provided
      if media_files.any?
        post_data[:attachments] = prepare_media(media_files)
      end
      
      # Add reply_to if provided
      post_data[:reply_to_id] = reply_to if reply_to.present?
      
      # Make the API request to Threads
      response = api_request('/api/text', post_data)
      
      if response[:success]
        {
          success: true,
          post_id: response[:data][:id],
          url: "https://threads.net/#{response[:data][:user][:username]}/post/#{response[:data][:id]}"
        }
      else
        response
      end
    end
    
    # Get user profile information
    # @param username [String] the username to look up
    # @return [Hash] response with success status and user details
    def get_profile(username)
      response = api_request('/api/users', { username: username }, :get)
      
      if response[:success]
        {
          success: true,
          username: response[:data][:username],
          display_name: response[:data][:full_name],
          avatar_url: response[:data][:profile_pic_url],
          follower_count: response[:data][:follower_count],
          following_count: response[:data][:following_count],
          bio: response[:data][:biography]
        }
      else
        response
      end
    end
    
    private
    
    # Make an API request to the Threads API
    # @param endpoint [String] the API endpoint
    # @param data [Hash] the request data
    # @param method [Symbol] the HTTP method (:post or :get)
    # @return [Hash] response with success status and data
    def api_request(endpoint, data, method = :post)
      uri = URI.parse("https://threads.net#{endpoint}")
      
      if method == :post
        request = Net::HTTP::Post.new(uri)
        request.body = data.to_json
      else
        request = Net::HTTP::Get.new(uri)
        uri.query = URI.encode_www_form(data)
      end
      
      request['Content-Type'] = 'application/json'
      request['Authorization'] = "Bearer #{@access_token}"
      
      begin
        response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
          http.request(request)
        end
        
        if response.code == '200'
          { success: true, data: JSON.parse(response.body, symbolize_names: true) }
        else
          { success: false, error: "API request failed with status #{response.code}", details: response.body }
        end
      rescue => e
        { success: false, error: "API request error: #{e.message}" }
      end
    end
    
    # Prepare media files for attachment
    # @param media_files [Array<MediaFile>] the media files to prepare
    # @return [Array<Hash>] formatted media data for the API
    def prepare_media(media_files)
      media_files.map do |file|
        attachment = {
          url: file.url,
          type: file.file_type.start_with?('image/') ? 'image' : 'video'
        }
        
        attachment[:alt_text] = file.name if file.name.present?
        attachment
      end
    end
    
    # Validate the post content
    # @param content [String] the post content
    # @raise [ArgumentError] if content is invalid
    def validate_content!(content)
      raise ArgumentError, "Content can't be blank" if content.blank?
      
      platform = Platform.find_by(name: 'threads')
      if platform && content.length > platform.character_limit
        raise ArgumentError, "Content exceeds the maximum length of #{platform.character_limit} characters"
      end
    end
  end
end
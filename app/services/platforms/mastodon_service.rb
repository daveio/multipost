module Platforms
  class MastodonService
    attr_reader :access_token, :instance_url
    
    def initialize(access_token, instance_url)
      @access_token = access_token
      @instance_url = instance_url
    end
    
    # Post a status to Mastodon
    # @param content [String] the text content to post
    # @param media_files [Array<MediaFile>] optional media files to attach
    # @param visibility [String] post visibility ('public', 'unlisted', 'private', 'direct')
    # @return [Hash] response with success status and details
    def create_post(content, media_files = [], visibility = 'public')
      validate_content!(content)
      
      # Upload media files first if provided
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
      
      # Prepare the post data
      post_data = {
        status: content,
        visibility: visibility
      }
      
      # Add media IDs if we have them
      post_data[:media_ids] = media_ids if media_ids.any?
      
      # Make the API request to Mastodon
      response = api_request('/api/v1/statuses', post_data)
      
      if response[:success]
        {
          success: true,
          post_id: response[:data][:id],
          url: response[:data][:url]
        }
      else
        response
      end
    end
    
    # Get the current user's account information
    # @return [Hash] response with success status and account details
    def verify_credentials
      response = api_request('/api/v1/accounts/verify_credentials', {}, :get)
      
      if response[:success]
        {
          success: true,
          username: response[:data][:username],
          display_name: response[:data][:display_name],
          avatar_url: response[:data][:avatar],
          follower_count: response[:data][:followers_count],
          following_count: response[:data][:following_count]
        }
      else
        response
      end
    end
    
    private
    
    # Upload a media file to Mastodon
    # @param file [MediaFile] the file to upload
    # @return [Hash] response with success status and media ID
    def upload_media(file)
      response = api_request('/api/v1/media', {
        file: file.url,
        description: file.name
      })
      
      if response[:success]
        {
          success: true,
          media_id: response[:data][:id]
        }
      else
        response
      end
    end
    
    # Make an API request to the Mastodon API
    # @param endpoint [String] the API endpoint
    # @param data [Hash] the request data
    # @param method [Symbol] the HTTP method (:post or :get)
    # @return [Hash] response with success status and data
    def api_request(endpoint, data, method = :post)
      uri = URI.parse("#{@instance_url}#{endpoint}")
      
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = uri.scheme == 'https'
      
      if method == :post
        request = Net::HTTP::Post.new(uri.path)
        request.set_form_data(data)
      else
        request = Net::HTTP::Get.new(uri.path)
      end
      
      request['Authorization'] = "Bearer #{@access_token}"
      
      begin
        response = http.request(request)
        
        if response.code == '200'
          { success: true, data: JSON.parse(response.body, symbolize_names: true) }
        else
          { success: false, error: "API request failed with status #{response.code}", details: response.body }
        end
      rescue => e
        { success: false, error: "API request error: #{e.message}" }
      end
    end
    
    # Validate the post content
    # @param content [String] the post content
    # @raise [ArgumentError] if content is invalid
    def validate_content!(content)
      raise ArgumentError, "Content can't be blank" if content.blank?
      
      platform = Platform.find_by(name: 'mastodon')
      if platform && content.length > platform.character_limit
        raise ArgumentError, "Content exceeds the maximum length of #{platform.character_limit} characters"
      end
    end
  end
end
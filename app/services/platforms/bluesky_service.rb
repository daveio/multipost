module Platforms
  class BlueskyService
    attr_reader :access_token, :instance_url

    def initialize(access_token, instance_url = "https://bsky.app")
      @access_token = access_token
      @instance_url = instance_url
    end

    # Post a text update to Bluesky
    # @param content [String] the text content to post
    # @param media_files [Array<MediaFile>] optional media files to attach
    # @return [Hash] response with success status and details
    def create_post(content, media_files = [])
      validate_content!(content)

      # Prepare the post data
      post_data = {
        text: content,
        createdAt: Time.now.iso8601
      }

      # Add media if provided
      if media_files.any?
        post_data[:media] = prepare_media(media_files)
      end

      # Make the API request to Bluesky
      response = api_request("/xrpc/com.atproto.repo.createRecord", post_data)

      if response[:success]
        {
          success: true,
          post_id: response[:data][:uri],
          url: "#{@instance_url}/profile/#{response[:data][:uri].split('/')[2]}/post/#{response[:data][:cid]}"
        }
      else
        response
      end
    end

    # Get a user's profile information
    # @param username [String] the username to look up
    # @return [Hash] response with success status and user details
    def get_profile(username)
      response = api_request("/xrpc/app.bsky.actor.getProfile", { actor: username })

      if response[:success]
        {
          success: true,
          username: response[:data][:handle],
          display_name: response[:data][:displayName],
          avatar_url: response[:data][:avatar],
          follower_count: response[:data][:followersCount],
          following_count: response[:data][:followsCount]
        }
      else
        response
      end
    end

    private

    # Make an API request to the Bluesky API
    # @param endpoint [String] the API endpoint
    # @param data [Hash] the request data
    # @return [Hash] response with success status and data
    def api_request(endpoint, data)
      uri = URI.parse("#{@instance_url}#{endpoint}")
      request = Net::HTTP::Post.new(uri)
      request["Content-Type"] = "application/json"
      request["Authorization"] = "Bearer #{@access_token}"
      request.body = data.to_json

      begin
        response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
          http.request(request)
        end

        if response.code == "200"
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
        {
          alt: file.name,
          image: file.url
        }
      end
    end

    # Validate the post content
    # @param content [String] the post content
    # @raise [ArgumentError] if content is invalid
    def validate_content!(content)
      raise ArgumentError, "Content can't be blank" if content.blank?

      platform = Platform.find_by(name: "bluesky")
      if platform && content.length > platform.character_limit
        raise ArgumentError, "Content exceeds the maximum length of #{platform.character_limit} characters"
      end
    end
  end
end

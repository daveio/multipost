module Platforms
  class BaseService
    # Create a post on the platform
    # @param content [String] The post content
    # @param media_files [Array<MediaFile>] Optional media files to attach
    # @param reply_to_id [String] Optional ID of post to reply to
    # @return [Hash] Response with success status, post_id, and url if successful
    def create_post(content, media_files = [], reply_to_id = nil)
      raise NotImplementedError, "Subclasses must implement this method"
    end
    
    # Delete a post on the platform
    # @param post_id [String] The ID of the post to delete
    # @return [Hash] Response with success status
    def delete_post(post_id)
      raise NotImplementedError, "Subclasses must implement this method"
    end
    
    # Get a post from the platform
    # @param post_id [String] The ID of the post to get
    # @return [Hash] Response with post details
    def get_post(post_id)
      raise NotImplementedError, "Subclasses must implement this method"
    end
    
    # Initialize the client connection to the platform
    # @return [Object] The client object
    def init_client
      raise NotImplementedError, "Subclasses must implement this method"
    end
    
    protected
    
    # Format the URL of a post
    # @param post_id [String] The ID of the post
    # @return [String] The URL of the post
    def format_post_url(post_id)
      raise NotImplementedError, "Subclasses must implement this method"
    end
  end
end
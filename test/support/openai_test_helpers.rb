module OpenaiTestHelpers
  # Mock the OpenAI service for testing
  # This replaces the actual API calls with predictable test responses
  class MockOpenaiService
    def initialize(api_key = 'mock_api_key')
      @api_key = api_key
    end
    
    def split_post(content, platform_name, strategies = [])
      # Validate input as the real service does
      return { success: false, error: 'Content is required' } if content.blank?
      return { success: false, error: 'Platform is required' } if platform_name.blank?
      
      # Get platform character limit
      platform = Platform.find_by(name: platform_name)
      return { success: false, error: 'Invalid platform' } unless platform
      
      # For testing "error" scenarios when needed
      return { success: false, error: 'Simulated API error' } if content.include?("TRIGGER_ERROR")
      
      # Create a predictable split based on content length and platform character limit
      splits = []
      
      # If content is short enough, just return it as a single post
      if content.length <= platform.character_limit
        splits << {
          "content" => "#{content} 1/1",
          "character_count" => content.length + 4 # + " 1/1"
        }
      else
        # Split content by sentences for a simple but logical split
        sentences = content.split(/(?<=[.!?])\s+/)
        current_post = ""
        post_number = 1
        total_posts = (content.length.to_f / (platform.character_limit * 0.8)).ceil # Estimate total posts
        
        sentences.each do |sentence|
          # If adding this sentence would exceed the limit, create a new post
          if (current_post + sentence).length > (platform.character_limit - 6) # Space for " X/Y"
            splits << {
              "content" => "#{current_post.strip} #{post_number}/#{total_posts}",
              "character_count" => current_post.length + 6 # + " X/Y"
            }
            post_number += 1
            current_post = sentence + " "
          else
            current_post += sentence + " "
          end
        end
        
        # Add the final post
        if current_post.strip.present?
          splits << {
            "content" => "#{current_post.strip} #{post_number}/#{total_posts}",
            "character_count" => current_post.length + 6 # + " X/Y"
          }
        end
      end
      
      # Create a reasoning string based on the strategies
      reasoning = "Split based on "
      reasoning += if strategies.include?("semantic")
        "semantic meaning of content"
      elsif strategies.include?("sentence")
        "sentence boundaries"
      else
        "character limit"
      end
      
      # Return a structured response similar to the real API
      {
        success: true,
        splits: splits,
        reasoning: reasoning
      }
    end
    
    def optimize_post(content, platform_name)
      # Validate input as the real service does
      return { success: false, error: 'Content is required' } if content.blank?
      return { success: false, error: 'Platform is required' } if platform_name.blank?
      
      # Get platform information
      platform = Platform.find_by(name: platform_name)
      return { success: false, error: 'Invalid platform' } unless platform
      
      # For testing "error" scenarios when needed
      return { success: false, error: 'Simulated API error' } if content.include?("TRIGGER_ERROR")
      
      # Perform a simple "optimization" - in this case, truncate if needed
      optimized = if content.length > platform.character_limit
        content[0...(platform.character_limit - 3)] + "..."
      else
        content
      end
      
      # Return a structured response similar to the real API
      {
        success: true,
        optimized_content: optimized,
        reasoning: "Optimized for #{platform_name} by ensuring content is within character limit."
      }
    end
  end
  
  # Helper method to set up the mock
  def mock_openai_service
    original_service = OpenaiService
    
    # Replace the OpenaiService with our mock version
    silence_warnings do
      Object.const_set(:OpenaiService, MockOpenaiService)
    end
    
    # Yield to the block, then restore the original
    yield
    
    # Restore the original service
    silence_warnings do
      Object.const_set(:OpenaiService, original_service)
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
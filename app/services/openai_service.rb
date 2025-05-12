class OpenaiService
  require 'net/http'
  require 'uri'
  require 'json'

  def initialize(api_key = nil)
    @api_key = api_key || ENV['OPENAI_API_KEY']
    @api_url = 'https://api.openai.com/v1/chat/completions'
  end

  def split_post(content, platform_name, strategies = [])
    # Validate input
    return { success: false, error: 'Content is required' } if content.blank?
    return { success: false, error: 'Platform is required' } if platform_name.blank?

    # Get platform character limit
    platform = Platform.find_by(name: platform_name)
    return { success: false, error: 'Invalid platform' } unless platform

    # Prepare the prompt
    prompt = build_split_prompt(content, platform, strategies)

    # Make the API call
    response = chat_completion(prompt)

    # Parse the response
    if response[:success]
      begin
        # Parse the response to extract split posts
        result = JSON.parse(response[:content])
        
        # Ensure the result has the expected format
        if result.is_a?(Hash) && result['splits'].is_a?(Array)
          return {
            success: true,
            splits: result['splits'],
            reasoning: result['reasoning']
          }
        else
          return { success: false, error: 'Invalid response format from AI' }
        end
      rescue JSON::ParserError
        return { success: false, error: 'Failed to parse AI response' }
      end
    else
      return { success: false, error: response[:error] }
    end
  end

  def optimize_post(content, platform_name)
    # Validate input
    return { success: false, error: 'Content is required' } if content.blank?
    return { success: false, error: 'Platform is required' } if platform_name.blank?

    # Get platform information
    platform = Platform.find_by(name: platform_name)
    return { success: false, error: 'Invalid platform' } unless platform

    # Prepare the prompt
    prompt = build_optimization_prompt(content, platform)

    # Make the API call
    response = chat_completion(prompt)

    # Parse the response
    if response[:success]
      begin
        # Parse the response to extract optimized content
        result = JSON.parse(response[:content])
        
        # Ensure the result has the expected format
        if result.is_a?(Hash) && result['optimized_content'].is_a?(String)
          return {
            success: true,
            optimized_content: result['optimized_content'],
            reasoning: result['reasoning']
          }
        else
          return { success: false, error: 'Invalid response format from AI' }
        end
      rescue JSON::ParserError
        return { success: false, error: 'Failed to parse AI response' }
      end
    else
      return { success: false, error: response[:error] }
    end
  end

  private

  def chat_completion(prompt)
    uri = URI.parse(@api_url)
    request = Net::HTTP::Post.new(uri)
    request['Content-Type'] = 'application/json'
    request['Authorization'] = "Bearer #{@api_key}"

    request.body = {
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a helpful assistant skilled in optimizing social media content.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    }.to_json

    begin
      response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
        http.request(request)
      end

      if response.code == '200'
        parsed_response = JSON.parse(response.body)
        content = parsed_response['choices'][0]['message']['content']
        return { success: true, content: content }
      else
        return { success: false, error: "API request failed with status #{response.code}" }
      end
    rescue => e
      return { success: false, error: "API request error: #{e.message}" }
    end
  end

  def build_split_prompt(content, platform, strategies)
    # Format strategies for inclusion in the prompt
    strategy_descriptions = []
    if strategies.include?('semantic')
      strategy_descriptions << "- Split by meaning to keep related content together (semantic splitting)"
    end
    if strategies.include?('sentence')
      strategy_descriptions << "- Split at natural sentence boundaries when possible"
    end
    if strategies.include?('retain_hashtags')
      strategy_descriptions << "- Keep hashtags intact and consider including them in the final post of the thread"
    end
    if strategies.include?('preserve_mentions')
      strategy_descriptions << "- Keep mentions intact, especially at the beginning of the thread"
    end

    # Default to semantic if no strategies provided
    if strategy_descriptions.empty?
      strategy_descriptions << "- Split by meaning to keep related content together (semantic splitting)"
    end

    <<~PROMPT
      I need to split a post into multiple parts for a thread on #{platform.name.capitalize}. 
      Each post must be under #{platform.character_limit} characters.

      Original content:
      ```
      #{content}
      ```

      Splitting strategies to use:
      #{strategy_descriptions.join("\n")}

      Please split this content into appropriate-sized posts for #{platform.name.capitalize}.
      Include thread numbering automatically (1/X, 2/X, etc.) at the end of each post.
      
      Return your response as a JSON object with the following format:
      {
        "splits": [
          {"content": "First post content... 1/3", "character_count": 123},
          {"content": "Second post content... 2/3", "character_count": 456},
          {"content": "Third post content... 3/3", "character_count": 789}
        ],
        "reasoning": "Brief explanation of your splitting approach and why you made the choices you did."
      }
    PROMPT
  end

  def build_optimization_prompt(content, platform)
    <<~PROMPT
      I need to optimize this content for #{platform.name.capitalize}. The character limit is #{platform.character_limit}.

      Original content:
      ```
      #{content}
      ```

      Please optimize this content for #{platform.name.capitalize} considering:
      - Keep essential information while being concise
      - Use abbreviations appropriately when necessary
      - Maintain hashtags and mentions
      - For Bluesky/Mastodon, take advantage of longer post limits if needed
      - For Threads, optimize for short, engaging content under 500 characters
      
      Return your response as a JSON object with the following format:
      {
        "optimized_content": "The optimized post content...",
        "reasoning": "Brief explanation of your optimization approach."
      }
    PROMPT
  end
end
# frozen_string_literal: true

class AnthropicService
  include HTTParty
  base_uri 'https://api.anthropic.com'
  format :json

  attr_reader :api_key, :model, :max_tokens

  # Initialize a new AnthropicService instance
  #
  # @param api_key [String] Your Anthropic API key
  # @param model [String] The Claude model to use (defaults to claude-3-opus-20240229)
  # @param max_tokens [Integer] The maximum number of tokens to generate (defaults to 1024)
  def initialize(api_key: ENV['ANTHROPIC_API_KEY'], model: 'claude-3-opus-20240229', max_tokens: 1024)
    @api_key = api_key
    @model = model
    @max_tokens = max_tokens

    raise ArgumentError, 'API key cannot be nil or empty' if @api_key.nil? || @api_key.empty?
  end

  # Generate text completion from Claude
  #
  # @param prompt [String] The prompt to send to Claude
  # @param system_prompt [String] Optional system prompt for context (defaults to nil)
  # @param temperature [Float] Controls randomness (0.0 to 1.0, defaults to 0.7)
  # @param options [Hash] Additional options to pass to the API
  # @return [Hash] The API response
  def complete(prompt, system_prompt: nil, temperature: 0.7, **options)
    payload = {
      model: model,
      max_tokens: max_tokens,
      temperature: temperature,
      messages: [
        { role: 'user', content: prompt }
      ],
      stream: false
    }

    # Add system prompt if provided
    payload[:system] = system_prompt if system_prompt

    # Merge additional options
    payload.merge!(options)

    response = self.class.post(
      '/v1/messages',
      body: payload.to_json,
      headers: {
        'Content-Type' => 'application/json',
        'x-api-key' => api_key,
        'anthropic-version' => '2023-06-01'
      }
    )

    handle_response(response)
  end

  # Generate text with streaming response
  #
  # @param prompt [String] The prompt to send to Claude
  # @param system_prompt [String] Optional system prompt for context (defaults to nil)
  # @param temperature [Float] Controls randomness (0.0 to 1.0, defaults to 0.7)
  # @param block [Block] Block to execute for each chunk of the streaming response
  # @param options [Hash] Additional options to pass to the API
  # @return [Hash] The complete API response
  def stream(prompt, system_prompt: nil, temperature: 0.7, **options, &block)
    raise ArgumentError, 'Block is required for streaming' unless block_given?

    payload = {
      model: model,
      max_tokens: max_tokens,
      temperature: temperature,
      messages: [
        { role: 'user', content: prompt }
      ],
      stream: true
    }

    # Add system prompt if provided
    payload[:system] = system_prompt if system_prompt

    # Merge additional options
    payload.merge!(options)

    accumulated_response = nil

    self.class.post(
      '/v1/messages',
      body: payload.to_json,
      headers: {
        'Content-Type' => 'application/json',
        'x-api-key' => api_key,
        'anthropic-version' => '2023-06-01'
      },
      stream_body: true
    ) do |chunk|
      # Handle the streaming response chunks
      next if chunk.strip.empty?

      # Parse the chunk (format: data: {json})
      if chunk.start_with?('data:')
        json_str = chunk.sub('data:', '').strip
        next if json_str == '[DONE]'

        begin
          parsed_chunk = JSON.parse(json_str)
          yield parsed_chunk
          accumulated_response = parsed_chunk
        rescue JSON::ParserError => e
          Rails.logger.error("Error parsing streaming response: #{e.message}")
        end
      end
    end

    accumulated_response
  end

  # Create a chat completion with multiple messages
  #
  # @param messages [Array<Hash>] Array of message objects with role and content keys
  # @param system_prompt [String] Optional system prompt for context (defaults to nil)
  # @param temperature [Float] Controls randomness (0.0 to 1.0, defaults to 0.7)
  # @param options [Hash] Additional options to pass to the API
  # @return [Hash] The API response
  def chat(messages, system_prompt: nil, temperature: 0.7, **options)
    payload = {
      model: model,
      max_tokens: max_tokens,
      temperature: temperature,
      messages: messages,
      stream: false
    }

    # Add system prompt if provided
    payload[:system] = system_prompt if system_prompt

    # Merge additional options
    payload.merge!(options)

    response = self.class.post(
      '/v1/messages',
      body: payload.to_json,
      headers: {
        'Content-Type' => 'application/json',
        'x-api-key' => api_key,
        'anthropic-version' => '2023-06-01'
      }
    )

    handle_response(response)
  end

  private

  # Handle the API response
  #
  # @param response [HTTParty::Response] The API response
  # @return [Hash] The parsed response or error details
  def handle_response(response)
    if response.success?
      JSON.parse(response.body)
    else
      error_message = begin
        error_data = JSON.parse(response.body)
        "#{error_data['error']['type']}: #{error_data['error']['message']}"
      rescue
        "HTTP Error: #{response.code} - #{response.message}"
      end

      Rails.logger.error("Anthropic API Error: #{error_message}")
      { error: error_message, status: response.code }
    end
  end
end
